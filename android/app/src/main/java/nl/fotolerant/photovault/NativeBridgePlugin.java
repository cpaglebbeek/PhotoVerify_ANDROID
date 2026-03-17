package nl.fotolerant.photovault;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeBridge")
public class NativeBridgePlugin extends Plugin {

    @PluginMethod
    public void openFolderPicker(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        activity.openFolderPicker();
        call.resolve();
    }

    @PluginMethod
    public void openFilePicker(PluginCall call) {
        String mimeType = call.getString("mimeType", "*/*");
        MainActivity activity = (MainActivity) getActivity();
        activity.openFilePicker(mimeType);
        call.resolve();
    }

    @PluginMethod
    public void saveFileFromPath(PluginCall call) {
        String filename = call.getString("filename");
        String tempPath = call.getString("tempPath");
        String mimeType = call.getString("mimeType");

        MainActivity activity = (MainActivity) getActivity();
        try {
            String cleanPath = tempPath.replace("file://", "");
            activity.saveFromTempFile(cleanPath, filename, mimeType);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
