import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminStore } from '@/store/adminStore';

type TabType = 'overview' | 'users' | 'exercises' | 'logs' | 'notify';

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
}

function TabChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabChip, active && styles.tabChipActive]}>
      <Ionicons name={icon} size={16} color={active ? '#0d9488' : '#64748b'} />
      <Text style={[styles.tabChipLabel, active && styles.tabChipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function AdminHubScreen() {
  const { data, isLoading, error, initialize, toggleUserStatus, deletePost, deleteExercise, sendBroadcast } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [confirmState, setConfirmState] = useState<
    | { type: 'user'; id: string; name: string; nextLabel: string }
    | { type: 'exercise'; id: string; name: string }
    | { type: 'post'; id: string; author: string }
    | null
  >(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleRefresh = async () => {
    await initialize();
  };

  const analytics = data?.analytics;

  const overviewCards = useMemo(
    () => [
      { icon: 'people-outline', label: 'Members', value: analytics?.users.total ?? 0, tint: '#0d9488' },
      { icon: 'flash-outline', label: 'Active sessions', value: analytics?.content.activeSessions ?? 0, tint: '#d97706' },
      { icon: 'barbell-outline', label: 'Exercises', value: analytics?.content.exercises ?? 0, tint: '#4338ca' },
      { icon: 'chatbubbles-outline', label: 'Community posts', value: analytics?.content.communityPosts ?? 0, tint: '#be185d' },
    ],
    [analytics]
  );

  const confirmAction = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === 'user') {
        await toggleUserStatus(confirmState.id);
      } else if (confirmState.type === 'exercise') {
        await deleteExercise(confirmState.id);
      } else if (confirmState.type === 'post') {
        await deletePost(confirmState.id);
      }
    } catch (error) {
      Alert.alert('Action failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setConfirmState(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    try {
      await sendBroadcast(broadcastTitle.trim(), broadcastBody.trim());
      Alert.alert('Sent', 'Broadcast sent to active members.');
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (error) {
      Alert.alert('Broadcast failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#08111f', '#0f172a', '#134e4a']} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={12} color="#0d9488" />
            <Text style={styles.badgeText}>ADMIN ONLY</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE CONTROL ROOM</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>One dashboard for members, content, and moderation</Text>
        <Text style={styles.heroCopy}>
          Keep the fitness system healthy from a single admin view. Review activity, manage users, curate exercises, and send announcements without leaving the app.
        </Text>

        <View style={styles.heroStatsRow}>
          <MetricCard icon="people-outline" label="Members" value={analytics?.users.total ?? 0} tint="#0d9488" />
          <MetricCard icon="barbell-outline" label="Exercises" value={analytics?.content.exercises ?? 0} tint="#1d4ed8" />
          <MetricCard icon="flash-outline" label="Sessions" value={analytics?.content.activeSessions ?? 0} tint="#d97706" />
        </View>

        <Pressable style={styles.refreshButton} onPress={handleRefresh}>
          <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.refreshGradient}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.refreshText}>Refresh dashboard</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.tabRail}>
        <TabChip active={activeTab === 'overview'} icon="stats-chart-outline" label="Overview" onPress={() => setActiveTab('overview')} />
        <TabChip active={activeTab === 'users'} icon="people-outline" label="Users" onPress={() => setActiveTab('users')} />
        <TabChip active={activeTab === 'exercises'} icon="barbell-outline" label="Exercises" onPress={() => setActiveTab('exercises')} />
        <TabChip active={activeTab === 'logs'} icon="terminal-outline" label="Logs" onPress={() => setActiveTab('logs')} />
        <TabChip active={activeTab === 'notify'} icon="notifications-outline" label="Notify" onPress={() => setActiveTab('notify')} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      ) : (
        <View style={styles.sectionWrap}>
          {activeTab === 'overview' && (
            <>
              <View style={styles.grid}>
                {overviewCards.map((card) => (
                  <View key={card.label} style={styles.metricCardLarge}>
                    <View style={[styles.metricIcon, { backgroundColor: card.tint }]}>
                      <Ionicons name={card.icon} size={18} color="#fff" />
                    </View>
                    <Text style={styles.metricLabel}>{card.label}</Text>
                    <Text style={styles.metricValue}>{card.value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Retention snapshot</Text>
                <View style={styles.retentionRow}>
                  <View style={[styles.retentionCard, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={styles.retentionValue}>{analytics?.retention.newLast7Days ?? 0}</Text>
                    <Text style={styles.retentionLabel}>New signups</Text>
                  </View>
                  <View style={[styles.retentionCard, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.retentionValue}>{analytics?.retention.activeLast7Days ?? 0}</Text>
                    <Text style={styles.retentionLabel}>Active last 7 days</Text>
                  </View>
                </View>
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Popular exercises</Text>
                {(analytics?.popularExercises ?? []).map((exercise, index) => (
                  <View key={`${exercise.name}-${index}`} style={styles.popularRow}>
                    <View style={styles.rankBubble}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.popularName}>{exercise.name}</Text>
                    <View style={styles.popularCountBubble}>
                      <Text style={styles.popularCountText}>{exercise.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === 'users' && (
            <FlatList
              data={data?.users ?? []}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.avatarBubble}>
                    <Text style={styles.avatarText}>{item.profile.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle}>{item.profile.name}</Text>
                    <Text style={styles.listMeta}>{item.email || item.phone || 'No contact saved'}</Text>
                    <Text style={styles.listMetaSmall}>Joined {formatDate(item.createdAt)}</Text>
                  </View>
                  <Pressable
                    style={[styles.actionPill, item.deactivatedAt ? styles.actionPillDanger : styles.actionPillSuccess]}
                    onPress={() =>
                      setConfirmState({
                        type: 'user',
                        id: item.id,
                        name: item.profile.name,
                        nextLabel: item.deactivatedAt ? 'activate' : 'suspend',
                      })
                    }
                  >
                    <Text style={[styles.actionPillText, item.deactivatedAt ? styles.actionPillTextDanger : styles.actionPillTextSuccess]}>
                      {item.deactivatedAt ? 'Suspended' : 'Active'}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          )}

          {activeTab === 'exercises' && (
            <FlatList
              data={data?.exercises ?? []}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={[styles.avatarBubble, { backgroundColor: '#ecfeff' }]}>
                    <Ionicons name="barbell-outline" size={18} color="#0d9488" />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listMeta}>{item.muscleGroup} • {item.difficulty}</Text>
                    <Text style={styles.listMetaSmall}>{item.commentCount} comments • {item.favoriteCount} favorites</Text>
                  </View>
                  <Pressable
                    style={[styles.actionPill, styles.actionPillDanger]}
                    onPress={() => setConfirmState({ type: 'exercise', id: item.id, name: item.name })}
                  >
                    <Text style={[styles.actionPillText, styles.actionPillTextDanger]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            />
          )}

          {activeTab === 'logs' && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Recent request logs</Text>
              {(data?.system.requestLogs ?? []).slice(0, 12).map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logCopy}>
                    <Text style={styles.logRoute}>{log.method} {log.path}</Text>
                    <Text style={styles.logMeta}>{formatDate(log.timestamp)} • {log.durationMs}ms</Text>
                  </View>
                  <View style={[styles.statusChip, log.statusCode >= 400 ? styles.statusChipError : styles.statusChipOk]}>
                    <Text style={[styles.statusChipText, log.statusCode >= 400 ? styles.statusChipTextError : styles.statusChipTextOk]}>
                      {log.statusCode}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'logs' && (
            <View style={styles.logsStack}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>API errors</Text>
                <Text style={styles.panelSubTitle}>Recent backend failures captured by telemetry.</Text>
                {(data?.system.apiErrors ?? []).slice(0, 8).length ? (
                  (data?.system.apiErrors ?? []).slice(0, 8).map((apiError) => (
                    <View key={apiError.id} style={styles.logRow}>
                      <View style={styles.logCopy}>
                        <Text style={styles.logRoute}>{apiError.method} {apiError.path}</Text>
                        <Text style={styles.logMeta}>{formatDate(apiError.timestamp)} • {apiError.message}</Text>
                      </View>
                      <View style={[styles.statusChip, styles.statusChipError]}>
                        <Text style={[styles.statusChipText, styles.statusChipTextError]}>{apiError.statusCode}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyStateText}>No API errors captured.</Text>
                )}
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Recent request logs</Text>
                {(data?.system.requestLogs ?? []).slice(0, 12).map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <View style={styles.logCopy}>
                      <Text style={styles.logRoute}>{log.method} {log.path}</Text>
                      <Text style={styles.logMeta}>{formatDate(log.timestamp)} • {log.durationMs}ms</Text>
                    </View>
                    <View style={[styles.statusChip, log.statusCode >= 400 ? styles.statusChipError : styles.statusChipOk]}>
                      <Text style={[styles.statusChipText, log.statusCode >= 400 ? styles.statusChipTextError : styles.statusChipTextOk]}>
                        {log.statusCode}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'notify' && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Global announcement</Text>
              <Text style={styles.panelSubTitle}>Send a notification to active FITRACK members.</Text>

              <TextInput
                style={styles.input}
                placeholder="Notification title"
                placeholderTextColor="#94a3b8"
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Message body"
                placeholderTextColor="#94a3b8"
                multiline
                value={broadcastBody}
                onChangeText={setBroadcastBody}
              />

              <Pressable style={styles.broadcastButton} onPress={handleBroadcast}>
                <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.broadcastGradient}>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.broadcastText}>Send broadcast</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <Modal visible={Boolean(confirmState)} transparent animationType="fade" onRequestClose={() => setConfirmState(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={42} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Confirm action</Text>
            <Text style={styles.modalText}>
              {confirmState?.type === 'user' && `Do you want to ${confirmState.nextLabel} ${confirmState.name}?`}
              {confirmState?.type === 'exercise' && `Delete ${confirmState.name} from the library?`}
              {confirmState?.type === 'post' && `Delete the post by ${confirmState.author}?`}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setConfirmState(null)}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={confirmAction}>
                <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  hero: { marginHorizontal: 14, marginTop: 12, padding: 18, borderRadius: 28 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  badgeText: { color: '#d1fae5', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { color: '#e2e8f0', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  heroCopy: { color: 'rgba(255,255,255,0.75)', lineHeight: 20, fontSize: 13, marginBottom: 16 },
  heroStatsRow: { flexDirection: 'row', gap: 10 },
  refreshButton: { borderRadius: 18, overflow: 'hidden', marginTop: 14, alignSelf: 'flex-start' },
  refreshGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  refreshText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  errorBanner: { marginHorizontal: 14, marginTop: 12, backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorBannerText: { color: '#991b1b', flex: 1, fontSize: 12, lineHeight: 16 },
  metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 12 },
  metricCardLarge: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  metricIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  metricValue: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  tabRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  tabChip: { flexGrow: 1, minWidth: '31%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)' },
  tabChipActive: { backgroundColor: '#ecfdf5', borderColor: 'rgba(13,148,136,0.25)' },
  tabChipLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tabChipLabelActive: { color: '#0d9488', fontWeight: '800' },
  loadingWrap: { minHeight: 260, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 20 },
  loadingText: { color: '#64748b', fontSize: 14 },
  sectionWrap: { paddingHorizontal: 14, paddingTop: 12, gap: 14 },
  logsStack: { gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  panel: { backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  panelTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  panelSubTitle: { color: '#64748b', fontSize: 13, marginBottom: 14, lineHeight: 18 },
  emptyStateText: { color: '#64748b', fontSize: 13, lineHeight: 18 },
  retentionRow: { flexDirection: 'row', gap: 12 },
  retentionCard: { flex: 1, padding: 16, borderRadius: 18 },
  retentionValue: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  retentionLabel: { color: '#475569', fontSize: 12, fontWeight: '600' },
  popularRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rankBubble: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  popularName: { flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '600' },
  popularCountBubble: { backgroundColor: '#f0fdfa', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  popularCountText: { color: '#0d9488', fontSize: 12, fontWeight: '800' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  avatarBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0d9488', fontWeight: '800', fontSize: 17 },
  listCopy: { flex: 1 },
  listTitle: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  listMeta: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  listMetaSmall: { color: '#94a3b8', fontSize: 11 },
  actionPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actionPillSuccess: { backgroundColor: '#ecfdf5' },
  actionPillDanger: { backgroundColor: '#fef2f2' },
  actionPillText: { fontSize: 12, fontWeight: '800' },
  actionPillTextSuccess: { color: '#15803d' },
  actionPillTextDanger: { color: '#b91c1c' },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logCopy: { flex: 1 },
  logRoute: { color: '#0f172a', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  logMeta: { color: '#64748b', fontSize: 11 },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipOk: { backgroundColor: '#ecfdf5' },
  statusChipError: { backgroundColor: '#fef2f2' },
  statusChipText: { fontSize: 12, fontWeight: '800' },
  statusChipTextOk: { color: '#15803d' },
  statusChipTextError: { color: '#b91c1c' },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 12, color: '#0f172a', marginBottom: 12 },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  broadcastButton: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  broadcastGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  broadcastText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 26, padding: 20, alignItems: 'center' },
  modalIcon: { marginBottom: 10 },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  modalButtonSecondary: { backgroundColor: '#e2e8f0' },
  modalButtonPrimary: { backgroundColor: '#0d9488' },
  modalButtonSecondaryText: { color: '#0f172a', fontWeight: '800' },
  modalButtonPrimaryText: { color: '#fff', fontWeight: '800' },
});