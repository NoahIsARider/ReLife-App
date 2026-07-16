import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { insertDigitalAssetSchema } from '../storage/database/shared/schema.js';

const router = Router();

// GET /api/v1/assets - 获取所有数字资产
router.get('/', async (req, res) => {
  try {
    const { category, importance } = req.query;
    const client = getSupabaseClient();
    let query = client.from('digital_assets').select('*').order('created_at', { ascending: false });

    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }
    if (importance && typeof importance === 'string') {
      query = query.eq('importance', parseInt(importance, 10));
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/v1/assets/stats - 获取资产统计
router.get('/stats', async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_assets').select('id, category, importance');
    if (error) throw new Error(`查询失败: ${error.message}`);

    const total = data?.length ?? 0;
    const categories: Record<string, number> = {};
    let highImportance = 0;
    for (const item of (data ?? [])) {
      categories[item.category] = (categories[item.category] || 0) + 1;
      if (item.importance >= 4) highImportance++;
    }
    res.json({ total, categories, highImportance });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/v1/assets - 创建数字资产
router.post('/', async (req, res) => {
  try {
    const parsed = insertDigitalAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '参数校验失败', details: parsed.error.flatten() });
      return;
    }
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_assets').insert(parsed.data).select().single();
    if (error) throw new Error(`创建失败: ${error.message}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT /api/v1/assets/:id - 更新数字资产
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_assets')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`更新失败: ${error.message}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/v1/assets/:id - 删除数字资产
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client.from('digital_assets').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
