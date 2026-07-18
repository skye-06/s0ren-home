import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteLinks = {
	notes: "https://s0ren-notes-dkquijal.edgeone.cool/",
	github: "https://github.com/skye-06",
} as const;

export const siteConfig: SiteConfig = {
	title: "S0ren",
	subtitle: "测绘 · 导航 · 空间智能",
	lang: "zh_CN",
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "assets/images/s0ren-banner.svg",
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		{
			name: "项目",
			url: "/projects/",
		},
		{
			name: "文章",
			url: "/archive/",
		},
		{
			name: "知识库",
			url: siteLinks.notes,
			external: true,
		},
		{
			name: "文档",
			url: "/documents/",
		},
		LinkPreset.About,
		{
			name: "GitHub",
			url: siteLinks.github,
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/s0ren-avatar.svg",
	name: "S0ren",
	bio: "武汉大学测绘学院 2024 级本科生",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: siteLinks.github,
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: false,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
