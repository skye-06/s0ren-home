import siteContent from "./site-content.json";

export type DocumentCategory = string;

export interface DocumentItem {
	id: string;
	title: string;
	category: DocumentCategory;
	description: string;
	date: string;
	file: `/documents/${string}.pdf`;
}

export const documentCategoryLabels: Record<string, string> = {
	internship: "专业实习",
	courses: "课程成果",
	projects: "项目文档",
	competitions: "竞赛材料",
	resume: "个人简历",
};

export const documents = siteContent.documents as DocumentItem[];
