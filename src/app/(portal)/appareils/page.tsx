import { PageHeading } from "@/components/portal/page-heading";
import { DeviceList } from "@/features/preferences/device-list";

export default function DevicesPage() { return <><PageHeading eyebrow="Sécurité" title="Appareils reconnus" description="Consultez les appareils autorisés à retrouver vos demandes sans nouvelle vérification immédiate." /><DeviceList /></>; }
