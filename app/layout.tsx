import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/store/auth-store";
import { AssessmentProvider } from "@/store/assessment-store";

export const metadata: Metadata = {
  title: "百岁白皮书 · 中国百岁健康标准指数评估",
  description:
    "基于中国百岁健康标准指数（CHLI）评估体系，从生物年龄、功能健康、代谢慢病、生活方式、心理社交与数字健康六大维度，生成个性化长寿指数分析报告。",
  keywords: ["长寿评估", "健康指数", "生物年龄", "CHLI", "百岁白皮书", "健康管理"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <AssessmentProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AssessmentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
