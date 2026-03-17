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
    public void saveToSelectedFolder(PluginCall call) {
        String filename = call.getString("filename");
        String base64Data = call.getString("base64Data");
        String mimeType = call.getString("mimeType");

        MainActivity activity = (MainActivity) getActivity();
        activity.saveToSelectedFolder(filename, base64Data, mimeType);
        call.resolve();
    }
}
