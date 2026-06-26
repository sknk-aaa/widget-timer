import * as React from 'react';
import { View, Platform } from 'react-native';

/**
 * チュートリアル動画などを iPhone のベゼルに収めて見せるフレーム。
 * 親の高さに合わせて縦長（端末比）にスケールする。children は画面いっぱいに敷く。
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          height: '96%',
          aspectRatio: 9 / 19.5,
          backgroundColor: '#0B0B0F',
          borderRadius: 44,
          padding: 6,
          ...(Platform.OS === 'ios'
            ? { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } }
            : { elevation: 10 }),
        }}
      >
        <View style={{ flex: 1, borderRadius: 38, overflow: 'hidden', backgroundColor: '#000' }}>
          {children}
        </View>
      </View>
    </View>
  );
}
