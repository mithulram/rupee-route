import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { customerApi, type RecipientResponse } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { TextField } from '../../src/components/TextField';
import { useBiometricAuth } from '../../src/hooks/useBiometricAuth';

export default function RecipientsTab() {
  const { authenticate, capability } = useBiometricAuth();
  const [recipients, setRecipients] = useState<RecipientResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await customerApi.listRecipients();
      setRecipients(list);
    } catch {
      setError('Unable to load recipients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createRecipient() {
    setError(null);
    const verified = await authenticate('Confirm adding a new recipient');
    if (!verified) {
      setError('Biometric verification required to add a recipient.');
      return;
    }

    try {
      await customerApi.createRecipient({
        type: 'bank_account',
        displayName: displayName.trim(),
        accountHolder: accountHolder.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        accountNumber: accountNumber.trim(),
      });
      setShowForm(false);
      setDisplayName('');
      setAccountHolder('');
      setIfsc('');
      setAccountNumber('');
      await load();
    } catch {
      setError('Could not create recipient. Check bank details.');
    }
  }

  if (isLoading && recipients.length === 0) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading recipients…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="recipients-tab">
      <Text
        accessibilityRole="header"
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={styles.title}
      >
        Recipients
      </Text>
      <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.hint}>
        Sensitive actions require {capability.label}.
      </Text>
      <Button
        label={showForm ? 'Cancel' : 'Add recipient'}
        onPress={() => {
          setShowForm((value) => !value);
        }}
        variant="secondary"
      />
      {showForm ? (
        <View style={styles.form}>
          <TextField label="Nickname" onChangeText={setDisplayName} value={displayName} />
          <TextField label="Account holder" onChangeText={setAccountHolder} value={accountHolder} />
          <TextField autoCapitalize="characters" label="IFSC" onChangeText={setIfsc} value={ifsc} />
          <TextField
            keyboardType="number-pad"
            label="Account number"
            onChangeText={setAccountNumber}
            value={accountNumber}
          />
          <Button
            disabled={!displayName || !accountHolder || !ifsc || !accountNumber}
            label="Save recipient"
            onPress={() => {
              void createRecipient();
            }}
          />
        </View>
      ) : null}
      {error ? (
        <Text
          accessibilityRole="alert"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={recipients}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            No recipients saved yet.
          </Text>
        }
        refreshControl={<RefreshControl onRefresh={() => void load()} refreshing={isLoading} />}
        renderItem={({ item }) => (
          <View accessibilityLabel={`Recipient ${item.displayName}`} style={styles.card}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.cardTitle}>
              {item.displayName}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.cardMeta}>
              {item.accountHolder} · {item.ifsc ?? item.upiId}
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
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: tokens.color.textSecondary,
    marginBottom: 12,
  },
  form: {
    gap: 12,
    marginVertical: 12,
  },
  list: {
    paddingTop: 12,
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
  error: {
    color: tokens.color.statusError,
    marginVertical: 8,
  },
});
