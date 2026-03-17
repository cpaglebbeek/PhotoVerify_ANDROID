package nl.fotolerant.photoverify;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.BridgeActivity;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.File;
import java.io.FileInputStream;
import android.util.Base64;

public class MainActivity extends BridgeActivity {
    private static final int RCODE_SELECT_FOLDER = 1001;
    private static final int RCODE_SELECT_FILE = 1002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initializeDefaultStorage();
        handleIntent(getIntent());
    }

    private void initializeDefaultStorage() {
        String uriString = getSharedPreferences("PhotoVerify", MODE_PRIVATE).getString("folder_uri", null);
        if (uriString == null) {
            File publicDocs = new File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOCUMENTS), "_PhotoVerify");
            if (!publicDocs.exists()) {
                publicDocs.mkdirs();
            }
            getSharedPreferences("PhotoVerify", MODE_PRIVATE).edit().putString("folder_uri", Uri.fromFile(publicDocs).toString()).apply();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    public void openFolderPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(intent, RCODE_SELECT_FOLDER);
    }

    /**
     * Native File Picker: Opens the system picker at the preferred PhotoVerify location.
     */
    public void openFilePicker(String mimeType) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        
        // Use stored folder as starting point if available
        String uriString = getSharedPreferences("PhotoVerify", MODE_PRIVATE).getString("folder_uri", null);
        if (uriString != null) {
            intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, Uri.parse(uriString));
        }
        
        startActivityForResult(intent, RCODE_SELECT_FILE);
    }
public void saveFromTempFile(String tempPath, String filename, String mimeType) throws Exception {
    String uriString = getSharedPreferences("PhotoVerify", MODE_PRIVATE).getString("folder_uri", null);
    Uri targetUri;
    DocumentFile targetDir;

    if (uriString != null) {
        targetUri = Uri.parse(uriString);
        targetDir = DocumentFile.fromTreeUri(this, targetUri);
    } else {
        // Default: Try to use public Documents folder
        File publicDocs = new File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOCUMENTS), "_PhotoVerify");
        if (!publicDocs.exists()) publicDocs.mkdirs();

        // If we can't write to public docs directly (EACCESS), this will throw later or return null
        targetDir = DocumentFile.fromFile(publicDocs);
    }

    if (targetDir == null || !targetDir.canWrite()) {
        throw new Exception("Permission Denied: Cannot write to target directory.");
    }

    String cleanName = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    DocumentFile newFile = targetDir.createFile(mimeType, cleanName);
    if (newFile == null) throw new Exception("Failed to create file. Permission may be required.");

    File src = new File(tempPath);
    try (InputStream in = new FileInputStream(src);
         OutputStream out = getContentResolver().openOutputStream(newFile.getUri())) {
        byte[] buf = new byte[8192];
        int len;
        while ((len = in.read(buf)) > 0) {
            out.write(buf, 0, len);
        }
        triggerJs("window.dispatchEvent(new CustomEvent('safSaveSuccess', { detail: { name: '" + cleanName + "' } }));");
    }
}

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != Activity.RESULT_OK || data == null) return;

        if (requestCode == RCODE_SELECT_FOLDER) {
            Uri treeUri = data.getData();
            getContentResolver().takePersistableUriPermission(treeUri, 
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            
            // Logic: If user picked a folder (like Documents), ensure "_PhotoVerify" exists inside it
            DocumentFile baseDir = DocumentFile.fromTreeUri(this, treeUri);
            DocumentFile targetDir = baseDir.findFile("_PhotoVerify");
            if (targetDir == null || !targetDir.isDirectory()) {
                targetDir = baseDir.createDirectory("_PhotoVerify");
            }
            
            Uri finalUri = targetDir != null ? targetDir.getUri() : treeUri;
            getSharedPreferences("PhotoVerify", MODE_PRIVATE).edit().putString("folder_uri", finalUri.toString()).apply();
            
            triggerJs("window.dispatchEvent(new CustomEvent('folderSelected', { detail: { uri: '" + finalUri.toString() + "' } }));");
        } 
        else if (requestCode == RCODE_SELECT_FILE) {
            Uri fileUri = data.getData();
            // Send selected file URI back to JS
            triggerJs("window.dispatchEvent(new CustomEvent('nativeFileSelected', { detail: { uri: '" + fileUri.toString() + "' } }));");
        }
    }

    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            Uri streamUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (streamUri != null) {
                // Buffer the URI and send it multiple times to ensure React side picks it up regardless of mount timing
                final String js = "window.dispatchEvent(new CustomEvent('sendIntent', { detail: { uri: '" + streamUri.toString() + "' } }));";
                triggerJs(js);
                // Retry after 1 and 2 seconds for cold starts
                bridge.getWebView().postDelayed(() -> triggerJs(js), 1000);
                bridge.getWebView().postDelayed(() -> triggerJs(js), 2500);
            }
        }
    }

    private void triggerJs(final String js) {
        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(js, null));
    }
}
