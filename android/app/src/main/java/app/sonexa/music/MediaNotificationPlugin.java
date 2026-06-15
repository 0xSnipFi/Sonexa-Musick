package app.sonexa.music;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.webkit.WebView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin bridging JavaScript ↔ native MusicService.
 * JS calls updateNowPlaying() → starts/updates foreground service.
 * Native notification buttons → broadcast → this plugin → JS callback.
 */
@CapacitorPlugin(name = "MediaNotification")
public class MediaNotificationPlugin extends Plugin {

    private BroadcastReceiver commandReceiver;

    @Override
    public void load() {
        // Listen for commands from MusicService notification buttons
        commandReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String cmd = intent.getStringExtra("command");
                if (cmd == null) return;
                // Forward to JS
                JSObject data = new JSObject();
                data.put("command", cmd);
                notifyListeners("mediaCommand", data, true);
            }
        };

        IntentFilter filter = new IntentFilter("app.sonexa.music.WEBVIEW_COMMAND");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(commandReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(commandReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (commandReceiver != null) {
            try { getContext().unregisterReceiver(commandReceiver); } catch (Exception ignored) {}
        }
    }

    @PluginMethod
    public void updateNowPlaying(PluginCall call) {
        String title = call.getString("title", "Sonexa");
        String artist = call.getString("artist", "");
        String artwork = call.getString("artwork", "");
        boolean playing = call.getBoolean("playing", false);
        long duration = (long) (call.getDouble("duration", 0.0) * 1000); // s → ms
        long position = (long) (call.getDouble("position", 0.0) * 1000);

        Intent intent = new Intent(getContext(), MusicService.class);
        intent.setAction(MusicService.ACTION_UPDATE);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("artwork", artwork);
        intent.putExtra("playing", playing);
        intent.putExtra("duration", duration);
        intent.putExtra("position", position);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
        } catch (Exception e) {
            // Foreground service may fail if app is truly in background on Android 12+
            try { getContext().startService(intent); } catch (Exception ignored) {}
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), MusicService.class);
        intent.setAction(MusicService.ACTION_STOP);
        try { getContext().startService(intent); } catch (Exception ignored) {}
        call.resolve();
    }
}
