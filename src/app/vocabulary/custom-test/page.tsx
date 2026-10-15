import { Metadata } from "next";
import CustomTestSetupClient from "./CustomTestSetupClient";

export const metadata: Metadata = {
  title: "Custom Vocabulary Test | EnglishPlatform",
};

export default function CustomTestPage() {
  return <CustomTestSetupClient />;
}
