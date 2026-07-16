import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { insertDigitalWillSchema } from '../storage/database/shared/schema.js';

const router = Router();

// GET /api/v1/wills - 获取所有遗嘱
router.get('/', async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_wills').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/v1/wills/:id - 获取单个遗嘱详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_wills').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '遗嘱不存在' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/v1/wills - 创建遗嘱
router.post('/', async (req, res) => {
  try {
    const parsed = insertDigitalWillSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '参数校验失败', details: parsed.error.flatten() });
      return;
    }
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_wills').insert(parsed.data).select().single();
    if (error) throw new Error(`创建失败: ${error.message}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT /api/v1/wills/:id - 更新遗嘱
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client.from('digital_wills')
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

// DELETE /api/v1/wills/:id - 删除遗嘱
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client.from('digital_wills').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
