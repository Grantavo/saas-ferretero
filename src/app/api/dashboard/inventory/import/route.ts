import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export const runtime = 'nodejs';

// Límites para mitigar DoS con archivos/columnas desmesurados.
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

export async function POST(request: Request) {
  try {
    // 1. Sesión autenticada obligatoria.
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1.1. El rol del usuario debe tener acceso al módulo inventario
    //      (la inserción baja por Service Role Key, que salta RLS,
    //      así que el control de módulo se refuerza acá, punto 7).
    const mod = await requireModuleAccess('inventory', { message: 'Acceso denegado al módulo inventario.' });
    if (mod.error) return NextResponse.json({ error: mod.error }, { status: mod.status ?? 403 });

    // 2. El tenant SIEMPRE se deriva del perfil del usuario autenticado.
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'No se pudo determinar la ferretería del usuario actual.' },
        { status: 400 }
      );
    }
    const tenant_id = profile.tenant_id;

    // 3. Leer archivo con límite de tamaño.
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se recibió el archivo.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el tamaño máximo (5 MB).' }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Parsear Excel en el servidor con exceljs (reemplaza a
    //    `xlsx`, que arrastra CVEs sin fix publicado — ver CHANGELOG).
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as any);

    const rawRows: Array<Record<string, any>> = [];
    workbook.eachSheet((sheet) => {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // encabezado
        const values = row.values as any[]; // 1-based: [null, c1, c2, ...]
        rawRows.push({
          name: values[1]?.value?.result ?? values[1]?.text ?? values[1] ?? '',
          brand: values[2]?.value?.result ?? values[2]?.text ?? values[2] ?? '',
          category: values[3]?.value?.result ?? values[3]?.text ?? values[3] ?? '',
          price_base: Number(values[4]?.value?.result ?? values[4] ?? 0) || 0,
          tax_percentage: Number(values[5]?.value?.result ?? values[5] ?? 19) || 0,
          stock: Number(values[6]?.value?.result ?? values[6] ?? 0) || 0,
          barcode: values[7]?.value?.result ?? values[7]?.text ?? values[7] ?? '',
          sku: values[8]?.value?.result ?? values[8]?.text ?? values[8] ?? '',
          stock_min: Number(values[9]?.value?.result ?? values[9] ?? 0) || 0,
        });
      });
    });

    // 5. Validar y preparar los productos.
    const products: any[] = [];
    const errors: string[] = [];

    for (const row of rawRows) {
      const name = String(row.name).trim();
      if (!name) { errors.push('Una fila no tiene nombre de producto.'); continue; }

      const base_price = Math.max(0, Number(row.price_base) || 0);
      if (Number.isNaN(base_price)) { errors.push(`Precio inválido para "${name}".`); continue; }

      const stock = Math.max(0, Number(row.stock) || 0);
      const min_stock = Math.max(0, Number(row.stock_min) || 5);

      products.push({
        tenant_id,
        name,
        brand: String(row.brand || ''),
        category: String(row.category || 'General'),
        barcode: String(row.barcode || ''),
        sku: String(row.sku || ''),
        base_price,
        tax_percentage: Number(row.tax_percentage) || 19,
        stock,
        min_stock,
      });
    }

    if (products.length === 0) {
      return NextResponse.json({ error: 'El archivo no contiene productos válidos.' }, { status: 400 });
    }
    if (products.length > MAX_ROWS) {
      return NextResponse.json({ error: `Máximo ${MAX_ROWS} productos por carga.` }, { status: 400 });
    }

    // 6. Insertar con Service Role Key en bloques (validación ya hecha
    //    server-side; correcto para una carga masiva).
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < products.length; i += 50) {
      const chunk = products.slice(i, i + 50);
      const { error } = await supabaseAdmin.from('products').insert(chunk);
      if (error) { errorCount += chunk.length; console.error('[inventory-import] bloque:', error.message); }
      else { successCount += chunk.length; }
    }

    return NextResponse.json({ success: successCount, errors: errorCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    console.error('[inventory-import] error:', message);
    return NextResponse.json({ error: 'Error al procesar el archivo: ' + message }, { status: 500 });
  }
}