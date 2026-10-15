import { Metadata } from "next";
import CustomTestRunnerClient from "./CustomTestRunnerClient";

export const metadata: Metadata = {
  title: "Custom Vocabulary Test | EnglishPlatform",
};

export default function CustomTestRunnerPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <CustomTestRunnerClient sessionId={params.sessionId} />;
}
