package com.aadikarta.web;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String KNOCK_CHANNEL_ID = "knock_alerts";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createKnockNotificationChannel();
    }

    // High-importance channel so a "knock" push rings/vibrates like an incoming
    // call instead of arriving as a silent notification when the app is backgrounded.
    private void createKnockNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
                KNOCK_CHANNEL_ID,
                "Consultation Knocks",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Alerts when a seeker wants a consultation while you're offline");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 500});

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        channel.setSound(RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE), audioAttributes);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
