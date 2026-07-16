import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { insertTrustedContactSchema } from '../storage/database/shared/schema.js';

const router = Router();

// GET /api/v1/contacts - 获取所有信任联系人
router.get('/', async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('trusted_contacts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/v1/contacts - 创建信任联系人
router.post('/', async (req, res) => {
  try {
    const parsed = insertTrustedContactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '参数校验失败', details: parsed.error.flatten() });
      return;
    }
    const client = getSupabaseClient();
    const { data, error } = await client.from('trusted_contacts').insert(parsed.data).select().single();
    if (error) throw new Error(`创建失败: ${error.message}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT /api/v1/contacts/:id - 更新信任联系人
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client.from('trusted_contacts')
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

// DELETE /api/v1/contacts/:id - 删除信任联系人
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client.from('trusted_contacts').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
