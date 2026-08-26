import CheckStorage from "@/components/dialogs/components/checkStorage.tsx";
import EditSheetDetailDialog from "./editSheetDetail";
import LoadingDialog from "./loadingDialog";
import MarkdownDialog from "./markdownDialog";
import RadioDialog from "./radioDialog";
import SimpleDialog from "./simpleDialog";
import SubscribePluginDialog from "./subscribePluginDialog";
import SetScheduleCloseTimeDialog from "./setScheduleCloseTimeDialog";
import PactDialog from "./pactDialog";

const dialogs = {
    SimpleDialog,
    RadioDialog,
    SubscribePluginDialog,
    LoadingDialog,
    EditSheetDetailDialog,
    CheckStorage,
    MarkdownDialog,
    SetScheduleCloseTimeDialog,
    PactDialog,
};

export default dialogs;

export type IDialogType = typeof dialogs;
export type IDialogKey = keyof IDialogType;
