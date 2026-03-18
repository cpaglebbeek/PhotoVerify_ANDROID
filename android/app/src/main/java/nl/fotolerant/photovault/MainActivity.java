package nl.fotolerant.photoverify;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;
import android.util.Base64;

public class MainActivity extends BridgeActivity {
    private static final int RCODE_SELECT_FOLDER = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    // --- JavaScript Interface Methods (Called via evaluateJavascript) ---

    public void openFolderPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(intent, RCODE_SELECT_FOLDER);
    }

    public void saveToSelectedFolder(String filename, String base64Data, String mimeType) {
        String uriString = getSharedPreferences("PhotoVerify", MODE_PRIVATE).getString("folder_uri", null);
        if (uriString == null) return;

        try {
            Uri treeUri = Uri.parse(uriString);
            DocumentFile pickedDir = DocumentFile.fromTreeUri(this, treeUri);
            DocumentFile newFile = pickedDir.createFile(mimeType, filename);
            
            byte[] data = Base64.decode(base64Data, Base64.DEFAULT);
            OutputStream out = getContentResolver().openOutputStream(newFile.getUri());
            out.write(data);
            out.close();
            
            triggerJs("window.dispatchEvent(new CustomEvent('safSaveSuccess', { detail: { name: '" + filename + "' } }));");
        } catch (Exception e) {
            triggerJs("window.dispatchEvent(new CustomEvent('safSaveError', { detail: { error: '" + e.getMessage() + "' } }));");
        }
    }

    // --- Internal Logic ---

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RCODE_SELECT_FOLDER && resultCode == Activity.RESULT_OK && data != null) {
            Uri treeUri = data.getData();
            // Persist access across reboots
            getContentResolver().takePersistableUriPermission(treeUri, 
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            
            // Save URI for later use
            getSharedPreferences("PhotoVerify", MODE_PRIVATE).edit().putString("folder_uri", treeUri.toString()).apply();
            
            triggerJs("window.dispatchEvent(new CustomEvent('folderSelected', { detail: { uri: '" + treeUri.toString() + "' } }));");
        }
    }

    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();
        if (Intent.ACTION_SEND.equals(action) && type != null && type.startsWith("image/")) {
            Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (imageUri != null) {
                triggerJs("window.dispatchEvent(new CustomEvent('sendIntent', { detail: { uri: '" + imageUri.toString() + "' } }));");
            }
        }
    }

    private void triggerJs(final String js) {
        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(js, null));
    }
}
