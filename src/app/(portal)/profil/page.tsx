import { PageHeading } from "@/components/portal/page-heading";
import { PreferencesForm } from "@/features/preferences/preferences-form";

export default function ProfilePage() { return <><PageHeading eyebrow="Préférences" title="Mon profil" description="Choisissez les informations utiles à la relation avec le support." /><PreferencesForm /></>; }
