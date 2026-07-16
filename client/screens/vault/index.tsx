import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Asset {
  id: string;
  name: string;
  category: string;
  platform: string;
  account: string;
  encrypted_password: string;
  url: string;
  notes: string;
  importance: number;
}

const categories = [
  { value: 'social', label: '社交', icon: 'message-circle' as const },
  { value: 'finance', label: '金融', icon: 'credit-card' as const },
  { value: 'gaming', label: '游戏', icon: 'smartphone' as const },
  { value: 'subscription', label: '订阅', icon: 'repeat' as const },
  { value: 'crypto', label: '数字资产', icon: 'lock' as const },
  { value: 'email', label: '邮箱', icon: 'mail' as const },
  { value: 'other', label: '其他', icon: 'grid' as const },
];

const categoryColors: Record<string, string> = {
  social: '#C4A0A0',
  finance: '#C4B08B',
  gaming: '#8E9AAB',
  subscription: '#A8B5A0',
  crypto: '#B5A0C4',
  email: '#A0B5C4',
  other: '#B5B0A0',
};

export default function VaultScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('social');
  const [formPlatform, setFormPlatform] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImportance, setFormImportance] = useState(3);

  const fetchAssets = useCallback(async () => {
    try {
      const url = filterCategory
        ? `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets?category=${filterCategory}`
        : `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets`;
      const res = await fetch(url);
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    }
  }, [filterCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
    }, [fetchAssets])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  }, [fetchAssets]);

  const resetForm = () => {
    setFormName('');
    setFormCategory('social');
    setFormPlatform('');
    setFormAccount('');
    setFormPassword('');
    setFormUrl('');
    setFormNotes('');
    setFormImportance(3);
  };

  const handleAdd = () => {
    setEditingAsset(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormPlatform(asset.platform);
    setFormAccount(asset.account || '');
    setFormPassword(asset.encrypted_password || '');
    setFormUrl(asset.url || '');
    setFormNotes(asset.notes || '');
    setFormImportance(asset.importance);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '删除后无法恢复，确定要删除这条资产记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            /**
             * 服务端文件：server/src/routes/assets.ts
             * 接口：DELETE /api/v1/assets/:id
             * Path 参数：id: string
             */
            await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets/${id}`, { method: 'DELETE' });
            fetchAssets();
          } catch (err) {
            console.error('Failed to delete:', err);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPlatform.trim()) {
      Alert.alert('提示', '请填写资产名称和平台');
      return;
    }
    try {
      const body = {
        name: formName.trim(),
        category: formCategory,
        platform: formPlatform.trim(),
        account: formAccount.trim() || null,
        encrypted_password: formPassword.trim() || null,
        url: formUrl.trim() || null,
        notes: formNotes.trim() || null,
        importance: formImportance,
      };

      if (editingAsset) {
        /**
         * 服务端文件：server/src/routes/assets.ts
         * 接口：PUT /api/v1/assets/:id
         * Path 参数：id: string
         * Body 参数：name: string, category: string, platform: string, account: string|null, encrypted_password: string|null, url: string|null, notes: string|null, importance: number
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets/${editingAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        /**
         * 服务端文件：server/src/routes/assets.ts
         * 接口：POST /api/v1/assets
         * Body 参数：name: string, category: string, platform: string, account: string|null, encrypted_password: string|null, url: string|null, notes: string|null, importance: number
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setModalVisible(false);
      resetForm();
      fetchAssets();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const getCategoryInfo = (cat: string) => categories.find(c => c.value === cat) || categories[6];

  return (
    <Screen backgroundColor="#F5F0EB" safeAreaEdges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>资产库</Text>
        <Text style={styles.pageSubtitle}>管理您的数字资产清单</Text>
      </View>

      {/* Category Filter */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>全部</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.filterChip, filterCategory === cat.value && styles.filterChipActive]}
            onPress={() => setFilterCategory(cat.value)}
          >
            <Text style={[styles.filterChipText, filterCategory === cat.value && styles.filterChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A0A0" />}
      >
        {assets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="database" size={28} color="#C4A0A0" />
            </View>
            <Text style={styles.emptyTitle}>暂无资产记录</Text>
            <Text style={styles.emptyDesc}>点击下方按钮添加您的第一个数字资产</Text>
          </View>
        ) : (
          assets.map(asset => {
            const catInfo = getCategoryInfo(asset.category);
            const color = categoryColors[asset.category] || '#C4A0A0';
            return (
              <TouchableOpacity key={asset.id} style={styles.assetCard} onPress={() => handleEdit(asset)} onLongPress={() => handleDelete(asset.id)}>
                <View style={styles.assetRow}>
                  <View style={[styles.assetIcon, { backgroundColor: `${color}18` }]}>
                    <Feather name={catInfo.icon} size={20} color={color} />
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetPlatform}>{asset.platform}</Text>
                    {asset.account ? <Text style={styles.assetAccount}>{asset.account}</Text> : null}
                  </View>
                  <View style={styles.assetRight}>
                    <View style={styles.importanceDots}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={[styles.dot, i <= asset.importance ? { backgroundColor: color } : styles.dotInactive]} />
                      ))}
                    </View>
                    <Feather name="chevron-right" size={16} color="#BEB5AD" />
                  </View>
                </View>
              </TouchableOpacity>
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
                  <Text style={styles.modalTitle}>{editingAsset ? '编辑资产' : '添加资产'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={22} color="#8B7D75" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>资产名称 *</Text>
                  <TextInput style={styles.input} placeholder="如：微信账号" placeholderTextColor="#BEB5AD" value={formName} onChangeText={setFormName} />

                  <Text style={styles.label}>分类</Text>
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[styles.categoryChip, formCategory === cat.value && { backgroundColor: `${categoryColors[cat.value]}25`, borderColor: categoryColors[cat.value] }]}
                        onPress={() => setFormCategory(cat.value)}
                      >
                        <Feather name={cat.icon} size={14} color={formCategory === cat.value ? categoryColors[cat.value] : '#8B7D75'} />
                        <Text style={[styles.categoryChipText, formCategory === cat.value && { color: categoryColors[cat.value] }]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.label}>平台 *</Text>
                  <TextInput style={styles.input} placeholder="如：腾讯微信" placeholderTextColor="#BEB5AD" value={formPlatform} onChangeText={setFormPlatform} />

                  <Text style={styles.label}>账号</Text>
                  <TextInput style={styles.input} placeholder="用户名/手机号/邮箱" placeholderTextColor="#BEB5AD" value={formAccount} onChangeText={setFormAccount} />

                  <Text style={styles.label}>密码</Text>
                  <TextInput style={styles.input} placeholder="密码信息" placeholderTextColor="#BEB5AD" value={formPassword} onChangeText={setFormPassword} secureTextEntry />

                  <Text style={styles.label}>网址</Text>
                  <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#BEB5AD" value={formUrl} onChangeText={setFormUrl} autoCapitalize="none" />

                  <Text style={styles.label}>重要程度</Text>
                  <View style={styles.importanceRow}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <TouchableOpacity key={i} onPress={() => setFormImportance(i)}>
                        <Feather name={i <= formImportance ? 'star' : 'star'} size={24} color={i <= formImportance ? '#C4B08B' : '#D4CEC8'} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>备注</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="其他需要记录的信息..." placeholderTextColor="#BEB5AD" value={formNotes} onChangeText={setFormNotes} multiline numberOfLines={3} />
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
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#FAF7F4' },
  filterChipActive: { backgroundColor: 'rgba(196, 160, 160, 0.15)' },
  filterChipText: { fontSize: 13, color: '#8B7D75', fontWeight: '500' },
  filterChipTextActive: { color: '#C4A0A0', fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  assetCard: {
    backgroundColor: '#FAF7F4', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#4A3F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  assetRow: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  assetInfo: { flex: 1, marginLeft: 14 },
  assetName: { fontSize: 16, fontWeight: '600', color: '#4A3F3A' },
  assetPlatform: { fontSize: 13, color: '#8B7D75', marginTop: 2 },
  assetAccount: { fontSize: 12, color: '#BEB5AD', marginTop: 2 },
  assetRight: { alignItems: 'flex-end', gap: 6 },
  importanceDots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotInactive: { backgroundColor: '#E8E3DE' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(196, 160, 160, 0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3F3A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#8B7D75', textAlign: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#C4A0A0', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C4A0A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 63, 58, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F0EB', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#4A3F3A' },
  modalBody: { paddingHorizontal: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#8B7D75', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#EDE8E3', borderRadius: 14, padding: 14, fontSize: 15, color: '#4A3F3A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#EDE8E3', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  categoryChipText: { fontSize: 12, color: '#8B7D75', fontWeight: '500' },
  importanceRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 30 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EDE8E3' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#8B7D75' },
  saveBtn: { backgroundColor: '#C4A0A0' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
