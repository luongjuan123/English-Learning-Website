import { Metadata } from "next";
import CustomVocabClient from "./CustomVocabClient";

export const metadata: Metadata = {
  title: "Custom Vocabulary Builder | EnglishPlatform",
};

export default function CustomVocabPage() {
  return <CustomVocabClient />;
}
