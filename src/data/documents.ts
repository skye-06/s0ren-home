export type DocumentCategory =
	| "internship"
	| "courses"
	| "projects"
	| "competitions"
	| "resume";

export interface DocumentItem {
	title: string;
	category: DocumentCategory;
	description: string;
	date: string;
	file: `/documents/${string}.pdf`;
}

export const documentCategoryLabels: Record<DocumentCategory, string> = {
	internship: "专业实习",
	courses: "课程成果",
	projects: "项目文档",
	competitions: "竞赛材料",
	resume: "个人简历",
};

export const documents: DocumentItem[] = [
	{
		title: "文档页面功能示例",
		category: "courses",
		description: "用于验证 PDF 在线查看和下载功能，请替换为真实成果。",
		date: "2026-07-19",
		file: "/documents/courses/example.pdf",
	},
];
