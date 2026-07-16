import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Will {
  id: string;
  title: string;
  message: string;
  inactive_days: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#C4B08B' },
  active: { label: '生效中', color: '#A8B5A0' },
  triggered: { label: '已触发', color: '#C48A8A' },
};

export default function WillScreen() {
  const [wills, setWills] = useState<Will[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWill, setEditingWill] = useState<Will | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formDays, setFormDays] = useState('30');

  const fetchWills = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills`);
      const data = await res.json();
      setWills(data);
    } catch (err) {
      console.error('Failed to fetch wills:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWills();
    }, [fetchWills])
  );

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormDays('30');
  };

  const handleAdd = () => {
    setEditingWill(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (will: Will) => {
    setEditingWill(will);
    setFormTitle(will.title);
    setFormMessage(will.message || '');
    setFormDays(String(will.inactive_days));
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '删除后无法恢复，确定要删除这份遗嘱吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            /**
             * 服务端文件：server/src/routes/wills.ts
             * 接口：DELETE /api/v1/wills/:id
             * Path 参数：id: string
             */
            await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills/${id}`, { method: 'DELETE' });
            fetchWills();
          } catch (err) {
            console.error('Failed to delete:', err);
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (will: Will) => {
    const newStatus = will.status === 'active' ? 'draft' : 'active';
    try {
      /**
       * 服务端文件：server/src/routes/wills.ts
       * 接口：PUT /api/v1/wills/:id
       * Path 参数：id: string
       * Body 参数：status: string
       */
      await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills/${will.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchWills();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('提示', '请填写遗嘱标题');
      return;
    }
    try {
      const body = {
        title: formTitle.trim(),
        message: formMessage.trim() || null,
        inactive_days: parseInt(formDays, 10) || 30,
      };

      if (editingWill) {
        /**
         * 服务端文件：server/src/routes/wills.ts
         * 接口：PUT /api/v1/wills/:id
         * Path 参数：id: string
         * Body 参数：title: string, message: string|null, inactive_days: number
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills/${editingWill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        /**
         * 服务端文件：server/src/routes/wills.ts
         * 接口：POST /api/v1/wills
         * Body 参数：title: string, message: string|null, inactive_days: number
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setModalVisible(false);
      resetForm();
      fetchWills();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  return (
    <Screen backgroundColor="#F5F0EB" safeAreaEdges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>数字遗嘱</Text>
        <Text style={styles.pageSubtitle}>安排好您的数字身后事</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Explanation Card */}
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: 'rgba(196, 176, 139, 0.12)' }]}>
            <Feather name="info" size={18} color="#C4B08B" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>什么是数字遗嘱？</Text>
            <Text style={styles.infoDesc}>
              当您连续一定天数未登录时，系统将自动通知您指定的信任联系人，并移交预设的数字资产信息。
            </Text>
          </View>
        </View>

        {wills.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="file-text" size={28} color="#C4B08B" />
            </View>
            <Text style={styles.emptyTitle}>还没有遗嘱</Text>
            <Text style={styles.emptyDesc}>创建您的第一份数字遗嘱</Text>
          </View>
        ) : (
          wills.map(will => {
            const config = statusConfig[will.status] || statusConfig.draft;
            return (
              <View key={will.id} style={styles.willCard}>
                <TouchableOpacity onPress={() => handleEdit(will)} style={styles.willMain}>
                  <View style={styles.willHeader}>
                    <Text style={styles.willTitle}>{will.title}</Text>
                    <View style={[styles.badge, { backgroundColor: `${config.color}18` }]}>
                      <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
                      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                  {will.message ? (
                    <Text style={styles.willMessage} numberOfLines={2}>{will.message}</Text>
                  ) : null}
                  <View style={styles.willMeta}>
                    <Feather name="clock" size={12} color="#BEB5AD" />
                    <Text style={styles.willMetaText}>触发条件：{will.inactive_days} 天未活跃</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.willActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, will.status === 'active' ? styles.actionBtnActive : styles.actionBtnInactive]}
                    onPress={() => handleToggleStatus(will)}
                  >
                    <Feather name={will.status === 'active' ? 'pause' : 'play'} size={14} color={will.status === 'active' ? '#A8B5A0' : '#8B7D75'} />
                    <Text style={[styles.actionBtnText, will.status === 'active' ? { color: '#A8B5A0' } : {}]}>
                      {will.status === 'active' ? '暂停' : '激活'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(will.id)}>
                    <Feather name="trash-2" size={14} color="#C48A8A" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)} disabled={Platform.OS === 'web'}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingWill ? '编辑遗嘱' : '创建遗嘱'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={22} color="#8B7D75" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>遗嘱标题 *</Text>
                  <TextInput style={styles.input} placeholder="如：给家人的数字交代" placeholderTextColor="#BEB5AD" value={formTitle} onChangeText={setFormTitle} />

                  <Text style={styles.label}>触发天数</Text>
                  <View style={styles.daysRow}>
                    {[7, 14, 30, 60, 90].map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, formDays === String(d) && styles.dayChipActive]}
                        onPress={() => setFormDays(String(d))}
                      >
                        <Text style={[styles.dayChipText, formDays === String(d) && styles.dayChipTextActive]}>
                          {d}天
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>遗言寄语</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="写下您想对信任之人说的话..."
                    placeholderTextColor="#BEB5AD"
                    value={formMessage}
                    onChangeText={setFormMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#4A3F3A', letterSpacing: 1 },
  pageSubtitle: { fontSize: 14, color: '#8B7D75', marginTop: 6 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#FAF7F4', borderRadius: 18, padding: 16, marginBottom: 20,
    shadowColor: '#4A3F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#4A3F3A', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#8B7D75', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(196, 176, 139, 0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3F3A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#8B7D75' },
  willCard: {
    backgroundColor: '#FAF7F4', borderRadius: 18, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#4A3F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  willMain: { padding: 16 },
  willHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  willTitle: { fontSize: 16, fontWeight: '700', color: '#4A3F3A', flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, gap: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  willMessage: { fontSize: 13, color: '#8B7D75', marginTop: 8, lineHeight: 20 },
  willMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  willMetaText: { fontSize: 12, color: '#BEB5AD' },
  willActions: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#EDE8E3', padding: 10, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnActive: { backgroundColor: 'rgba(168, 181, 160, 0.10)' },
  actionBtnInactive: { backgroundColor: '#EDE8E3' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#8B7D75' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(196, 138, 138, 0.08)' },
  fab: {
    position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#C4B08B', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C4B08B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 63, 58, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F0EB', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#4A3F3A' },
  modalBody: { paddingHorizontal: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#8B7D75', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#EDE8E3', borderRadius: 14, padding: 14, fontSize: 15, color: '#4A3F3A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  textArea: { height: 100 },
  daysRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EDE8E3' },
  dayChipActive: { backgroundColor: 'rgba(196, 176, 139, 0.20)' },
  dayChipText: { fontSize: 14, color: '#8B7D75', fontWeight: '500' },
  dayChipTextActive: { color: '#C4B08B', fontWeight: '700' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 30 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EDE8E3' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#8B7D75' },
  saveBtn: { backgroundColor: '#C4B08B' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
