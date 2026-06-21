import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { customerApi, type SupportTicket } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { TextField } from '../../src/components/TextField';
import { formatDate } from '../../src/lib/format';

export default function HelpTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await customerApi.listSupportTickets();
      setTickets(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitTicket() {
    setMessage(null);
    try {
      await customerApi.createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
      });
      setSubject('');
      setDescription('');
      setMessage('Support ticket created in sandbox.');
      await load();
    } catch {
      setMessage('Unable to create support ticket.');
    }
  }

  if (isLoading && tickets.length === 0) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading help center…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="help-tab">
      <Text
        accessibilityRole="header"
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={styles.title}
      >
        Help
      </Text>
      <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.subtitle}>
        Contact sandbox support or review existing tickets.
      </Text>
      <View style={styles.form}>
        <TextField label="Subject" onChangeText={setSubject} value={subject} />
        <TextField
          label="Description"
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          style={styles.textArea}
          value={description}
        />
        <Button
          disabled={!subject.trim() || !description.trim()}
          label="Submit ticket"
          onPress={() => {
            void submitTicket();
          }}
        />
      </View>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.message}
        >
          {message}
        </Text>
      ) : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={tickets}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            No support tickets yet.
          </Text>
        }
        refreshControl={<RefreshControl onRefresh={() => void load()} refreshing={isLoading} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.cardTitle}>
              {item.subject}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.cardMeta}>
              {item.status} · {formatDate(item.createdAt)}
            </Text>
          </View>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: tokens.color.textSecondary,
    marginBottom: 12,
  },
  form: {
    gap: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  message: {
    color: tokens.color.statusSuccess,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  cardMeta: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  empty: {
    fontSize: 15,
    color: tokens.color.textSecondary,
    paddingVertical: 24,
  },
});
