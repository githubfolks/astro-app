package com.aadikarta.web;

import android.app.AlertDialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JsResult;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final String KNOCK_CHANNEL_ID = "knock_alerts";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // AndroidManifest.xml sets this activity's theme to AppTheme.NoActionBarLaunch
        // (the splash-screen theme) so the splash background/icon show correctly on
        // launch. Once the activity is actually created, switch to the real app theme
        // (no ActionBar) — otherwise the splash theme's default ActionBar sticks around
        // for the whole session, showing a native title bar above the WebView content.
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
        createKnockNotificationChannel();
        // Replace Capacitor's default WebChromeClient so JS alert()/confirm() dialogs
        // use an explicitly floating theme (see AppTheme.AlertDialogTheme) instead of
        // stretching full-screen under this activity's edge-to-edge (API 35) theme.
        getBridge().getWebView().setWebChromeClient(new AppWebChromeClient(getBridge()));
    }

    /** See AppTheme.AlertDialogTheme in styles.xml for why this override exists. */
    private static class AppWebChromeClient extends BridgeWebChromeClient {
        private final Bridge bridge;

        AppWebChromeClient(Bridge bridge) {
            super(bridge);
            this.bridge = bridge;
        }

        @Override
        public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
            if (bridge.getActivity().isFinishing()) {
                return true;
            }
            new AlertDialog.Builder(view.getContext(), R.style.AppTheme_AlertDialogTheme)
                .setMessage(message)
                .setPositiveButton("OK", (dialog, which) -> {
                    dialog.dismiss();
                    result.confirm();
                })
                .setOnCancelListener((dialog) -> {
                    dialog.dismiss();
                    result.cancel();
                })
                .create()
                .show();
            return true;
        }

        @Override
        public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
            if (bridge.getActivity().isFinishing()) {
                return true;
            }
            new AlertDialog.Builder(view.getContext(), R.style.AppTheme_AlertDialogTheme)
                .setMessage(message)
                .setPositiveButton("OK", (dialog, which) -> {
                    dialog.dismiss();
                    result.confirm();
                })
                .setNegativeButton("Cancel", (dialog, which) -> {
                    dialog.dismiss();
                    result.cancel();
                })
                .setOnCancelListener((dialog) -> {
                    dialog.dismiss();
                    result.cancel();
                })
                .create()
                .show();
            return true;
        }
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
