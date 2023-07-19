import { generateSitemap as sitemap } from "sitemap-ts";
import { PageData, defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/nixos-and-flakes-book-ru/'
  // remove trailing `.html`
  // https://vitepress.dev/guide/routing#generating-clean-url
  cleanUrls: true,
  // Whether to get the last updated timestamp for each page using Git.
  lastUpdated: true,

  // SEO Improvement - sitemap.xml & robots.txt
  buildEnd: async ({ outDir }) => {
    sitemap({
      hostname: "https://nixos-and-flakes.thiscute.world/",
      outDir: outDir,
      generateRobotsTxt: true,
    });
  },

  // SEO Improvement - JSON-LD
  transformPageData(pageData) {
    return {
      frontmatter: {
        ...pageData.frontmatter,
        head: [
          ["script", { type: "application/ld+json" }, getJSONLD(pageData)],
        ],
      },
    };
  },

  // markdown options
  markdown: {
    theme: "material-theme-palenight",
    lineNumbers: true,

    config: (md) => {
      // add support for footnote
      md.use(require("markdown-it-footnote"));
    },
  },

  themeConfig: {
    editLink: {
      pattern:
        "https://github.com/ryan4yin/nixos-and-flakes-book/edit/main/docs/:path",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ryan4yin/nixos-and-flakes-book",
      },
    ],
  },

  locales: {
    // In case of pr:
    // root: themeConfigEnglish(),
    // ru: themeConfigRussian(),
    root: themeConfigRussian(),
    en: themeConfigEnglish(),
    zh: themeConfigChinese(),
  },
});

function themeConfigEnglish() {
  return {
    label: "English",
    lang: "en",
    link: "/",
    title: "NixOS & Flakes Book",
    description: "An unofficial and opinionated book for beginners",

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "Home", link: "/" },
        { text: "Get Started", link: "/introduction/index.md" },
        { text: "Best Practices", link: "/best-practices/intro.md" },
      ],

      sidebar: [
        {
          text: "Get Started",
          items: [
            { text: "Introduction", link: "/introduction/index.md" },
            {
              text: "Advantages and Disadvantages",
              link: "/introduction/advantages-and-disadvantages.md",
            },
            {
              text: "Installation",
              link: "/introduction/installation.md",
            },
          ],
        },
        {
          text: "The Nix Language",
          items: [{ text: "Basics", link: "/the-nix-language/index.md" }],
        },
        {
          text: "NixOS with Flakes",
          items: [
            {
              text: "Get Started with NixOS",
              link: "/nixos-with-flakes/get-started-with-nixos.md",
            },
            {
              text: "Introduction to Flakes",
              link: "/nixos-with-flakes/introduction-to-flakes.md",
            },
            {
              text: "NixOS with Flakes Enabled",
              link: "/nixos-with-flakes/nixos-with-flakes-enabled.md",
            },
            {
              text: "Getting Started with Home Manager",
              link: "/nixos-with-flakes/start-using-home-manager.md",
            },
            {
              text: "Modularize the Configuration",
              link: "/nixos-with-flakes/modularize-the-configuration.md",
            },
            {
              text: "Updating the System",
              link: "/nixos-with-flakes/update-the-system.md",
            },
            {
              text: "Downgrading or Upgrading Packages",
              link: "/nixos-with-flakes/downgrade-or-upgrade-packages.md",
            },
            {
              text: "Other useful Tips",
              link: "/nixos-with-flakes/other-useful-tips.md",
            },
          ],
        },
        {
          text: "Nixpkgs's Advanced Usage",
          items: [
            { text: "Introduction", link: "/nixpkgs/intro.md" },
            { text: "callPackage", link: "/nixpkgs/callpackage.md" },
            { text: "Overridding", link: "/nixpkgs/overriding.md" },
            { text: "Overlays", link: "/nixpkgs/overlays.md" },
          ],
        },
        {
          text: "Best Practices",
          items: [
            { text: "Introduction", link: "/best-practices/intro.md" },
            {
              text: "Run downloaded binaries on NixOS",
              link: "/best-practices/run-downloaded-binaries-on-nixos.md",
            },
            {
              text: "Simplify NixOS-related Commands",
              link: "/best-practices/simplify-nixos-related-commands.md",
            },
            {
              text: "Debugging Derivations and Nix Expressions",
              link: "/best-practices/debugging.md",
            },
          ],
        },

        {
          text: "Other Usage of Flakes",
          items: [
            { text: "Introduction", link: "/other-usage-of-flakes/intro.md" },
            {
              text: "Flake Inputs",
              link: "/other-usage-of-flakes/inputs.md",
            },
            {
              text: "Flake Outputs",
              link: "/other-usage-of-flakes/outputs.md",
            },
            {
              text: "The New CLI",
              link: "/other-usage-of-flakes/the-new-cli.md",
            },
            {
              text: "Nix Options",
              link: "/other-usage-of-flakes/options.md",
            },
            {
              text: "Testing",
              link: "/other-usage-of-flakes/testing.md",
            },
          ],
        },
        {
          text: "Dev Environments on NixOS",
          items: [
            {
              text: "nix develop & pkgs.mkShell",
              link: "/development/intro.md",
            },
            {
              text: "Dev Environments",
              link: "/development/dev-environments.md",
            },
            {
              text: "Packaging 101",
              link: "/development/packaging-101.md",
            },
            {
              text: "Cross-platform Compilation",
              link: "/development/cross-platform-compilation.md",
            },
            {
              text: "Distribution Building",
              link: "/development/distributed-building.md",
            },
            {
              text: "Kernel Development",
              link: "/development/kernel-development.md",
            },
          ],
        },
        {
          text: "Advanced Topics",
          items: [
            { text: "Advanced Topics", link: "/advanced-topics/index.md" },
          ],
        },
        {
          text: "Frequently Asked Questions",
          items: [
            { text: "Frequently Asked Questions", link: "/faq/index.md" },
          ],
        },
      ],
    },
  };
}

function themeConfigChinese() {
  return {
    label: "简体中文",
    lang: "zh-CN",
    link: "/zh/",
    title: "NixOS 与 Flakes",
    description: "一份非官方的新手指南",

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "首页", link: "/zh/" },
        { text: "开始使用", link: "/zh/introduction/index.md" },
        { text: "最佳实践", link: "/zh/best-practices/intro.md" },
      ],

      sidebar: [
        {
          text: "开始使用",
          items: [
            { text: "简介", link: "/zh/introduction/index.md" },
            {
              text: "优缺点",
              link: "/zh/introduction/advantages-and-disadvantages.md",
            },
            {
              text: "安装",
              link: "/zh/introduction/installation.md",
            },
          ],
        },
        {
          text: "Nix 语言",
          items: [{ text: "快速入门", link: "/zh/the-nix-language/index.md" }],
        },

        {
          text: "NixOS 与 Flakes",
          items: [
            {
              text: "开始使用 NixOS",
              link: "/zh/nixos-with-flakes/get-started-with-nixos.md",
            },
            {
              text: "Flakes 简介",
              link: "/zh/nixos-with-flakes/introduction-to-flakes.md",
            },
            {
              text: "使用 Flakes 管理 NixOS",
              link: "/zh/nixos-with-flakes/nixos-with-flakes-enabled.md",
            },
            {
              text: "安装使用 Home Manager",
              link: "/zh/nixos-with-flakes/start-using-home-manager.md",
            },
            {
              text: "模块化系统配置",
              link: "/zh/nixos-with-flakes/modularize-the-configuration.md",
            },
            {
              text: "更新系统",
              link: "/zh/nixos-with-flakes/update-the-system.md",
            },
            {
              text: "降级或升级软件包",
              link: "/zh/nixos-with-flakes/downgrade-or-upgrade-packages.md",
            },
            {
              text: "其他杂七杂八的内容",
              link: "/zh/nixos-with-flakes/other-useful-tips.md",
            },
          ],
        },
        {
          text: "Nixpkgs 高级用法",
          items: [
            { text: "简介", link: "/zh/nixpkgs/intro.md" },
            { text: "callPackage", link: "/zh/nixpkgs/callpackage.md" },
            { text: "Overridding", link: "/zh/nixpkgs/overriding.md" },
            { text: "Overlays", link: "/zh/nixpkgs/overlays.md" },
          ],
        },
        {
          text: "NixOS 最佳实践",
          items: [
            { text: "简介", link: "/zh/best-practices/intro.md" },
            {
              text: "运行非 NixOS 的二进制文件",
              link: "/zh/best-practices/run-downloaded-binaries-on-nixos.md",
            },
            {
              text: "使用 Makefile 简化常用命令",
              link: "/zh/best-practices/simplify-nixos-related-commands.md",
            },
            {
              text: "调试 Nix 软件包与 Nix 表达式",
              link: "/zh/best-practices/debugging.md",
            },
          ],
        },
        {
          text: "Flakes 的其他玩法",
          items: [
            { text: "简介", link: "/zh/other-usage-of-flakes/intro.md" },
            {
              text: "Flake Inputs",
              link: "/zh/other-usage-of-flakes/inputs.md",
            },
            {
              text: "Flake Outputs",
              link: "/zh/other-usage-of-flakes/outputs.md",
            },
            {
              text: "新一代 Nix 命令行工具的使用",
              link: "/zh/other-usage-of-flakes/the-new-cli.md",
            },
            {
              text: "Nix Options",
              link: "/zh/other-usage-of-flakes/options.md",
            },
            {
              text: "Testing",
              link: "/zh/other-usage-of-flakes/testing.md",
            },
          ],
        },
        {
          text: "在 NixOS 上进行开发工作",
          items: [
            {
              text: "nix develop 与 pkgs.mkShell",
              link: "/zh/development/intro.md",
            },
            {
              text: "各语言的开发环境",
              link: "/zh/development/dev-environments.md",
            },
            {
              text: "软件打包",
              link: "/zh/development/packaging-101.md",
            },
            {
              text: "跨平台编译",
              link: "/zh/development/cross-platform-compilation.md",
            },
            {
              text: "分布式构建",
              link: "/zh/development/distributed-building.md",
            },
            {
              text: "内核开发",
              link: "/zh/development/kernel-development.md",
            },
          ],
        },
        {
          text: "其他进阶话题",
          items: [
            { text: "其他进阶话题", link: "/zh/advanced-topics/index.md" },
          ],
        },
        {
          text: "常见问题 FAQ",
          items: [{ text: "常见问题 FAQ", link: "/zh/faq/index.md" }],
        },
      ],
    },
  };
}

function themeConfigRussian() {
  return {
    label: "Русский",
    lang: "ru",
    link: "/ru/",
    title: "NixOS & Flakes Book",
    description: "An unofficial and opinionated book for beginners",

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "Home", link: "/ru/" },
        { text: "Get Started", link: "introduction/index.md" },
        { text: "Best Practices", link: "best-practices/intro.md" },
      ],

      sidebar: [
        {
          text: "Стартуем",
          items: [
            { text: "Введение", link: "/ru/introduction/index.md" },
            {
              text: "Плюсы и минусы",
              link: "/ru/introduction/advantages-and-disadvantages.md",
            },
            {
              text: "Установка",
              link: "/ru/introduction/installation.md",
            },
          ],
        },
        {
          text: "Язык Nix",
          items: [
            { text: "Основы", link: "/ru/the-nix-language/index.md" },
            { text: "Одностраничник", link: "/ru/the-nix-language/one-pager.md" }
          ],
        },
        {
          text: "NixOS + Flakes = 🖤",
          items: [
            {
              text: "Начинаем разбираться с NixOS",
              link: "/ru/nixos-with-flakes/get-started-with-nixos.md",
            },
            {
              text: "Введедние в флейки",
              link: "/ru/nixos-with-flakes/introduction-to-flakes.md",
            },
            {
              text: "Подрубаем Flakes",
              link: "/ru/nixos-with-flakes/nixos-with-flakes-enabled.md",
            },
            {
              text: "Разбираемся с Home Manager",
              link: "/ru/nixos-with-flakes/start-using-home-manager.md",
            },
            {
              text: "Разбиваем конфиг на модули",
              link: "/ru/nixos-with-flakes/modularize-the-configuration.md",
            },
            {
              text: "Обновление системы",
              link: "/ru/nixos-with-flakes/update-the-system.md",
            },
            {
              text: "Обновление и откат пакетов",
              link: "/ru/nixos-with-flakes/downgrade-or-upgrade-packages.md",
            },
            {
              text: "Полезности",
              link: "/ru/nixos-with-flakes/other-useful-tips.md",
            },
          ],
        },
        {
          text: "Nixpkgs's Advanced Usage",
          items: [
            { text: "Introduction", link: "/ru/nixpkgs/intro.md" },
            { text: "callPackage", link: "/ru/nixpkgs/callpackage.md" },
            { text: "Overridding", link: "/ru/nixpkgs/overriding.md" },
            { text: "Overlays", link: "/ru/nixpkgs/overlays.md" },
          ],
        },
        {
          text: "Best Practices",
          items: [
            { text: "Introduction", link: "/ru/best-practices/intro.md" },
            {
              text: "Run downloaded binaries on NixOS",
              link: "/ru/best-practices/run-downloaded-binaries-on-nixos.md",
            },
            {
              text: "Simplify NixOS-related Commands",
              link: "/ru/best-practices/simplify-nixos-related-commands.md",
            },
            {
              text: "Debugging Derivations and Nix Expressions",
              link: "/ru/best-practices/debugging.md",
            },
          ],
        },

        {
          text: "Other Usage of Flakes",
          items: [
            { text: "Introduction", link: "/ru/other-usage-of-flakes/intro.md" },
            {
              text: "Flake Inputs",
              link: "/ru/other-usage-of-flakes/inputs.md",
            },
            {
              text: "Flake Outputs",
              link: "/ru/other-usage-of-flakes/outputs.md",
            },
            {
              text: "The New CLI",
              link: "/ru/other-usage-of-flakes/the-new-cli.md",
            },
            {
              text: "Nix Options",
              link: "/ru/other-usage-of-flakes/options.md",
            },
            {
              text: "Testing",
              link: "/ru/other-usage-of-flakes/testing.md",
            },
          ],
        },
        {
          text: "Dev Environments on NixOS",
          items: [
            {
              text: "nix develop & pkgs.mkShell",
              link: "/ru/development/intro.md",
            },
            {
              text: "Dev Environments",
              link: "/ru/development/dev-environments.md",
            },
            {
              text: "Packaging 101",
              link: "/ru/development/packaging-101.md",
            },
            {
              text: "Cross-platform Compilation",
              link: "/ru/development/cross-platform-compilation.md",
            },
            {
              text: "Distribution Building",
              link: "/ru/development/distributed-building.md",
            },
            {
              text: "Kernel Development",
              link: "/ru/development/kernel-development.md",
            },
          ],
        },
        {
          text: "Advanced Topics",
          items: [
            { text: "Advanced Topics", link: "/ru/advanced-topics/index.md" },
          ],
        },
        {
          text: "Frequently Asked Questions",
          items: [
            { text: "Frequently Asked Questions", link: "/ru/faq/index.md" },
          ],
        },
      ],
    },
  };
};


function getJSONLD(pageData: PageData) {
  if (pageData.relativePath === "index.md") {
    return `{
  "@context":"http://schema.org",
  "@type":"WebSite",
  "url":"https:\/\/nixos-and-flakes.thiscute.world\/",
  "inLanguage":"en",
  "description":"An unofficial and opinionated book for beginners",
  "name":"${pageData.title}"
}`;
  } else if (pageData.relativePath === "zh/index.md") {
    return `{
  "@context":"http://schema.org",
  "@type":"WebSite",
  "url":"https:\/\/nixos-and-flakes.thiscute.world\/zh\/",
  "inLanguage":"zh-CN",
  "description":"一份非官方的新手指南",
  "name":"${pageData.title}"
}`;
  } else {
    let lang = pageData.relativePath.startsWith("zh/") ? "zh-CN" : "en";
    let url = `https:\/\/nixos-and-flakes.thiscute.world\/${pageData.relativePath
      .replace(/\.md$/, "")
      .replace(/\/index\$/, "/")}`;
    return `{
  "@context":"http://schema.org",
  "@type":"TechArticle",
  "headline":"${pageData.title} | NixOS & Flakes Book",
  "inLanguage":"${lang}",
  "mainEntityOfPage":{
     "@type":"WebPage",
     "@id":"${url}"
  },
  "keywords":"NixOS, Nix, Flakes, Linux, Tutorial",
  "url":"${url}"
}`;
  }
}
