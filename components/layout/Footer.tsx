import Link from "next/link";
import { Stethoscope, Mail, MapPin, ExternalLink, ShieldCheck, BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-900 text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        {/* 项目介绍 */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold">百岁白皮书 · 长寿评估</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            基于「中国百岁健康标准指数（CHLI）」评估体系，从生物年龄、功能健康、代谢慢病、
            生活方式、心理社交与数字健康六大维度，科学评估个体健康寿命，助力实现健康长寿百岁愿景。
          </p>

          {/* 百岁白皮书背景 */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen className="h-4 w-4" />
              《2026 高质量健康长寿白皮书》
            </div>
            <p className="text-xs leading-relaxed text-white/65">
              21世纪医学的目标不再只是延长寿命，而是延长健康寿命。
              未来医疗服务的核心，将从治疗疾病转变为管理健康风险，实现高质量健康长寿。
            </p>
            <a
              href="https://txh5.binjiela.com.cn/baisui/index.html#p=1"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300 transition-colors hover:text-amber-200"
            >
              阅读完整白皮书
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-5 flex items-start gap-2 text-xs text-white/50">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              本评估工具仅供健康管理参考，不构成医疗诊断建议。如有健康问题请及时就医。
            </span>
          </div>
        </div>

        {/* 快速导航 */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-white/90">快速导航</h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                首页
              </Link>
            </li>
            <li>
              <Link href="/questionnaire" className="transition-colors hover:text-white">
                开始评估
              </Link>
            </li>
            <li>
              <Link href="/history" className="transition-colors hover:text-white">
                我的报告
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-white">
                登录 / 注册
              </Link>
            </li>
          </ul>
        </div>

        {/* 联系我们 */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-white/90">联系我们</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <a
                href="mailto:bd-zhangkai976@pkucare.com"
                className="transition-colors hover:text-white"
              >
                bd-zhangkai976@pkucare.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>北京市丰台区丽泽平安金融中心 A 座 28F 北大医疗</span>
            </li>
          </ul>

          {/* 白皮书发布单位（本项目依据其开发） */}
          <div className="mt-5">
            <h5 className="mb-2 text-xs font-semibold text-white/60">《白皮书》指导单位</h5>
            <p className="text-xs leading-relaxed text-white/55">
              北京银发健康长寿研究院
              <br />
              上海交通大学医学遗传研究所
            </p>
            <h5 className="mb-2 mt-3 text-xs font-semibold text-white/60">《白皮书》联合发布单位</h5>
            <p className="text-xs leading-relaxed text-white/55">
              亚太长寿医学学会 (APLMS)
              <br />
              平安健康互联网股份有限公司
              <br />
              中国抗衰老促进会
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              本网站依据《2026 高质量健康长寿白皮书》开发，非上述单位官方出品。
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-white/40 md:flex-row md:text-left">
          <div>© 2026 百岁白皮书 · 中国百岁健康标准指数评估系统 版权所有</div>
          <div className="text-white/40">
            依据《2026 高质量健康长寿白皮书》开发
          </div>
        </div>
      </div>
    </footer>
  );
}
