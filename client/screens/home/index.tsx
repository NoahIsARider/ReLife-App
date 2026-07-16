import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface AssetStats {
  total: number;
  categories: Record<string, number>;
  highImportance: number;
}

interface WillItem {
  id: string;
  title: string;
  status: string;
  inactive_days: number;
}

interface ContactItem {
  id: string;
  name: string;
  relationship: string;
}

const categoryLabels: Record<string, string> = {
  social: '社交',
  finance: '金融',
  gaming: '游戏',
  subscription: '订阅',
  crypto: '数字资产',
  email: '邮箱',
  other: '其他',
};

export default function HomeScreen() {
  const router = useSafeRouter();
  const [stats, setStats] = useState<AssetStats>({ total: 0, categories: {}, highImportance: 0 });
  const [wills, setWills] = useState<WillItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, willsRes, contactsRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/assets/stats`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wills`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contacts`),
      ]);
      const statsData = await statsRes.json();
      const willsData = await willsRes.json();
      const contactsData = await contactsRes.json();
      setStats(statsData);
      setWills(willsData);
      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '生效中';
      case 'triggered': return '已触发';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return '#A8B5A0';
      case 'triggered': return '#C48A8A';
      default: return '#C4B08B';
    }
  };

  return (
    <Screen backgroundColor="#F5F0EB" safeAreaEdges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A0A0" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>每一份托付，都是对生命的温柔安排</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(196, 160, 160, 0.15)' }]}>
              <Feather name="database" size={20} color="#C4A0A0" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>数字资产</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(196, 176, 139, 0.15)' }]}>
              <Feather name="file-text" size={20} color="#C4B08B" />
            </View>
            <Text style={styles.statNumber}>{wills.length}</Text>
            <Text style={styles.statLabel}>数字遗嘱</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 181, 160, 0.15)' }]}>
              <Feather name="users" size={20} color="#A8B5A0" />
            </View>
            <Text style={styles.statNumber}>{contacts.length}</Text>
            <Text style={styles.statLabel}>信任之人</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/vault')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(196, 160, 160, 0.12)' }]}>
                <Feather name="plus" size={22} color="#C4A0A0" />
              </View>
              <Text style={styles.actionTitle}>添加资产</Text>
              <Text style={styles.actionDesc}>记录您的数字遗产</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/will')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(196, 176, 139, 0.12)' }]}>
                <Feather name="edit-3" size={22} color="#C4B08B" />
              </View>
              <Text style={styles.actionTitle}>写遗嘱</Text>
              <Text style={styles.actionDesc}>安排您的数字身后事</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Wills */}
        {wills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>遗嘱状态</Text>
              <TouchableOpacity onPress={() => router.push('/will')}>
                <Text style={styles.seeAll}>查看全部</Text>
              </TouchableOpacity>
            </View>
            {wills.slice(0, 3).map((will) => (
              <View key={will.id} style={styles.willCard}>
                <View style={styles.willInfo}>
                  <Text style={styles.willTitle}>{will.title}</Text>
                  <Text style={styles.willMeta}>{will.inactive_days}天未活跃触发</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor(will.status)}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(will.status) }]} />
                  <Text style={[styles.statusText, { color: statusColor(will.status) }]}>
                    {statusLabel(will.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {stats.total === 0 && wills.length === 0 && contacts.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="heart" size={32} color="#C4A0A0" />
            </View>
            <Text style={styles.emptyTitle}>开始您的数字遗产规划</Text>
            <Text style={styles.emptyDesc}>
              记录重要的数字资产，指定信任的人，{'\n'}让一切安排得从容而有序。
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4A3F3A',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7D75',
    marginTop: 8,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FAF7F4',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#4A3F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4A3F3A',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7D75',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A3F3A',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    color: '#C4A0A0',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FAF7F4',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4A3F3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3F3A',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#8B7D75',
    lineHeight: 18,
  },
  willCard: {
    backgroundColor: '#FAF7F4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#4A3F3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  willInfo: {
    flex: 1,
  },
  willTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A3F3A',
  },
  willMeta: {
    fontSize: 12,
    color: '#8B7D75',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(196, 160, 160, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A3F3A',
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#8B7D75',
    textAlign: 'center',
    lineHeight: 22,
  },
});
