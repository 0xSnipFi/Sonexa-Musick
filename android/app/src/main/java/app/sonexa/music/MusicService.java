package app.sonexa.music;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

/**
 * Foreground service that keeps audio alive when the app is backgrounded.
 * Shows a media notification with play/pause/next/prev controls.
 * Communicates with the WebView via broadcasts.
 */
public class MusicService extends Service {

    private static final String CHANNEL_ID = "sonexa_media";
    private static final int NOTIFICATION_ID = 1;

    public static final String ACTION_UPDATE = "app.sonexa.music.UPDATE";
    public static final String ACTION_PLAY = "app.sonexa.music.PLAY";
    public static final String ACTION_PAUSE = "app.sonexa.music.PAUSE";
    public static final String ACTION_NEXT = "app.sonexa.music.NEXT";
    public static final String ACTION_PREV = "app.sonexa.music.PREV";
    public static final String ACTION_STOP = "app.sonexa.music.STOP";

    private MediaSessionCompat mediaSession;
    private boolean isPlaying = false;
    private String currentTitle = "Sonexa";
    private String currentArtist = "";
    private String currentArtwork = "";
    private long currentDuration = 0;
    private long currentPosition = 0;
    private Bitmap artBitmap = null;
    private final ExecutorService artLoader = Executors.newSingleThreadExecutor();

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        createMediaSession();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;
        String action = intent.getAction();
        if (action == null) action = ACTION_UPDATE;

        switch (action) {
            case ACTION_UPDATE:
                currentTitle = intent.getStringExtra("title");
                if (currentTitle == null) currentTitle = "Sonexa";
                currentArtist = intent.getStringExtra("artist");
                if (currentArtist == null) currentArtist = "";
                String newArt = intent.getStringExtra("artwork");
                if (newArt != null && !newArt.equals(currentArtwork)) {
                    currentArtwork = newArt;
                    loadArtwork(newArt);
                }
                isPlaying = intent.getBooleanExtra("playing", false);
                currentDuration = intent.getLongExtra("duration", 0);
                currentPosition = intent.getLongExtra("position", 0);
                updateMediaSession();
                showNotification();
                break;
            case ACTION_PLAY:
                sendToWebView("play");
                break;
            case ACTION_PAUSE:
                sendToWebView("pause");
                break;
            case ACTION_NEXT:
                sendToWebView("next");
                break;
            case ACTION_PREV:
                sendToWebView("prev");
                break;
            case ACTION_STOP:
                stopForeground(true);
                stopSelf();
                break;
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        artLoader.shutdownNow();
        super.onDestroy();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Media Controls",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Music playback controls");
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private void createMediaSession() {
        mediaSession = new MediaSessionCompat(this, "SonexaSession");
        mediaSession.setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { sendToWebView("play"); }
            @Override public void onPause() { sendToWebView("pause"); }
            @Override public void onSkipToNext() { sendToWebView("next"); }
            @Override public void onSkipToPrevious() { sendToWebView("prev"); }
            @Override public void onSeekTo(long pos) { sendToWebView("seek:" + pos); }
            @Override public void onStop() {
                stopForeground(true);
                stopSelf();
            }
        });
        mediaSession.setActive(true);
    }

    private void updateMediaSession() {
        if (mediaSession == null) return;

        MediaMetadataCompat.Builder meta = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDuration);
        if (artBitmap != null) {
            meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artBitmap);
        }
        mediaSession.setMetadata(meta.build());

        long actions = PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                PlaybackStateCompat.ACTION_SEEK_TO |
                PlaybackStateCompat.ACTION_STOP;
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat ps = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, currentPosition, 1.0f)
                .build();
        mediaSession.setPlaybackState(ps);
    }

    private void showNotification() {
        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent prevPI = makePendingIntent(ACTION_PREV, 1);
        PendingIntent playPausePI = makePendingIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2);
        PendingIntent nextPI = makePendingIntent(ACTION_NEXT, 3);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setContentIntent(contentIntent)
                .setOngoing(isPlaying)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setStyle(new MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2))
                .addAction(android.R.drawable.ic_media_previous, "Previous", prevPI)
                .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        isPlaying ? "Pause" : "Play", playPausePI)
                .addAction(android.R.drawable.ic_media_next, "Next", nextPI);

        if (artBitmap != null) {
            builder.setLargeIcon(artBitmap);
        }

        Notification notification = builder.build();

        if (isPlaying) {
            try {
                startForeground(NOTIFICATION_ID, notification);
            } catch (Exception e) {
                NotificationManager nm = getSystemService(NotificationManager.class);
                if (nm != null) nm.notify(NOTIFICATION_ID, notification);
            }
        } else {
            try { stopForeground(false); } catch (Exception ignored) {}
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(NOTIFICATION_ID, notification);
        }
    }

    private PendingIntent makePendingIntent(String action, int reqCode) {
        Intent intent = new Intent(this, MusicService.class);
        intent.setAction(action);
        return PendingIntent.getService(this, reqCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void loadArtwork(String url) {
        if (url == null || url.isEmpty()) return;
        artLoader.submit(() -> {
            try {
                InputStream in = new URL(url).openStream();
                artBitmap = BitmapFactory.decodeStream(in);
                in.close();
                // Re-show notification with new art on main thread
                new android.os.Handler(getMainLooper()).post(() -> {
                    updateMediaSession();
                    showNotification();
                });
            } catch (Exception ignored) {}
        });
    }

    private void sendToWebView(String command) {
        // Broadcast to Capacitor plugin which forwards to WebView
        Intent i = new Intent("app.sonexa.music.WEBVIEW_COMMAND");
        i.putExtra("command", command);
        i.setPackage(getPackageName());
        sendBroadcast(i);
    }
}
