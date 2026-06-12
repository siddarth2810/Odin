import { SyntaxStyle } from "@opentui/core"

export type Colors = {
        background: string
        backgroundPanel: string
        backgroundElement: string
        buttonBackground: string
        borderSubtle: string
        border: string
        borderActive: string
        primary: string
        secondary: string
        accent: string
        error: string
        warning: string
        success: string
        info: string
        text: string
        textMuted: string
        markdownText: string
        markdownHeading: string
        markdownLink: string
        markdownLinkText: string
        markdownCode: string
        markdownCodeBackground: string
        markdownCodeBlockBackground: string
        markdownCodeBlock: string
        markdownCodeBorder: string
        markdownBlockQuote: string
        markdownEmph: string
        markdownStrong: string
        markdownHorizontalRule: string
        markdownListItem: string
        markdownListEnumeration: string
        markdownImage: string
        markdownImageText: string
        syntaxComment: string
        syntaxKeyword: string
        syntaxFunction: string
        syntaxVariable: string
        syntaxString: string
        syntaxNumber: string
        syntaxType: string
        syntaxOperator: string
        syntaxPunctuation: string
}

export const darkColors: Colors = {
        background: "#121212", //sidebar blend it
        backgroundPanel: "#252524",
        backgroundElement: "#121212", //background
        buttonBackground: "#303030",
        borderSubtle: "#808080",
        border: "#808080",
        borderActive: "#00afff",
        primary: "#ff8700",
        secondary: "#00afff",
        accent: "#ff87ff",
        error: "#ff5f5f",
        warning: "#d7af5f",
        success: "#5fd787",
        info: "#5fafff",
        text: "#FFFFFF", // text in dark background
        textMuted: "#808080",
        markdownText: "#eeeeee",
        markdownHeading: "#ff87ff",
        markdownLink: "#808080" ,//markdown link color
        markdownLinkText: "#9FC5F4",
        markdownCode: "#F3A8A8", //single quotes text color
        markdownCodeBackground: "#303030",
        markdownCodeBlockBackground: "#303030", //triple quotes backgrond
        markdownCodeBlock: "#9BE963", // code color under triple quotes
markdownCodeBorder: "#818898", //triple quotes title text
        markdownBlockQuote: "#808080",
        markdownEmph: "#d7af5f",
        markdownStrong: "#d7af5f",
        markdownHorizontalRule: "#808080",
        markdownListItem: "#ff8700",
        markdownListEnumeration: "#ff8700",
        markdownImage: "#00afff",
        markdownImageText: "#00afff",
        syntaxComment: "#808080",
        syntaxKeyword: "#af87ff",
        syntaxFunction: "#00d7ff",
        syntaxVariable: "#eeeeee",
        syntaxString: "#5fd787",
        syntaxNumber: "#d7af5f",
        syntaxType: "#5fafff",
        syntaxOperator: "#00d7ff",
        syntaxPunctuation: "#808080",
}

export const lightColors: Colors = {
                // the status bar color I want: #
        // background color: ##
        // text color blackis: #0B0B0B
        // codeblock within single quotes `` background color: #EEEEEC and the font color inside them #8D2525
        // codeblock with triple quotes ``` would be nice if i can get a background color  of #FCFAFB

        background: "#F8F8F6", //sidebar blend it
        backgroundPanel: "#EEEEEC", //footer bar color
        backgroundElement: "#F8F8F6", //background
        buttonBackground: "#e4e4e4",
        borderSubtle: "#6c6c6c",
        border: "#6c6c6c",
        borderActive: "#005fd7",
        primary: "#d75f00",
        secondary: "#005fd7",
        accent: "#af005f",
        error: "#d70000",
        warning: "#af5f00",
        success: "#008700",
        info: "#005faf",
        text: "#0B0B0B",
        textMuted: "#6c6c6c",
        markdownText: "#1c1c1c", // text color
        markdownHeading: "#af005f",
        markdownLink: "#005fd7",
        markdownLinkText: "#005fd7",
        markdownCode: "#C9413A", //single quotes text color
        markdownCodeBackground: "#E8E8E6", // single quotes color
        markdownCodeBlockBackground: "#fcfafb", //triple quotes background color
        markdownCodeBlock: "#008000", //triple quotes code color
        markdownCodeBorder: "#6E7687", //triple quotes title text color
        markdownBlockQuote: "#6E7687",
        markdownEmph: "#C96442",
        markdownStrong: "#C96442",
        markdownHorizontalRule: "#6c6c6c",
        markdownListItem: "#d75f00",
        markdownListEnumeration: "#d75f00",
        markdownImage: "#005fd7",
        markdownImageText: "#005fd7",
        syntaxComment:  "#6c6c6c",
        syntaxKeyword: "#8700af",
        syntaxFunction: "#0087af",
        syntaxVariable: "#1c1c1c",
        syntaxString: "#008700",
        syntaxNumber: "#af5f00",
        syntaxType: "#005faf",
        syntaxOperator: "#0087af",
        syntaxPunctuation: "#6c6c6c",
}

export const themes = {
        dark: darkColors,
        light: lightColors,
}

export type ThemeName = keyof typeof themes

export const defaultThemeName: ThemeName = "dark"
export const colors = themes[defaultThemeName]

export type MarkdownTheme = typeof markdownTheme
export const markdownTheme = {
        h1: {
                bold: true,
                marginTop: 2,
                marginBottom: 1,
                borderBottom: true,
        },
        h2: {
                bold: true,
                marginTop: 1,
                underline: true,
        },
        paragraph: {
                wrap: true,
                marginBottom: 1,
        },
        codeBlock: {
                border: true,
                syntaxHighlight: true,
                padding: 1,
        },
        blockquote: {
                leftBorder: true,
                dim: true,
        },
}

function createMarkdownSyntaxStyle(c: Colors) {
        return SyntaxStyle.fromTheme([
                { scope: ["default"], style: { foreground: c.markdownText } },
                { scope: ["markup.heading"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.heading.1"], style: { foreground: c.markdownHeading, bold: true, underline: true } },
                { scope: ["markup.heading.2"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.heading.3"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.heading.4"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.heading.5"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.heading.6"], style: { foreground: c.markdownHeading, bold: true } },
                { scope: ["markup.bold", "markup.strong"], style: { foreground: c.markdownStrong, bold: true } },
                { scope: ["markup.italic"], style: { foreground: c.markdownEmph, italic: true } },
                { scope: ["markup.list"], style: { foreground: c.markdownListItem } },
                { scope: ["markup.list.enumerator"], style: { foreground: c.markdownListEnumeration } },
                { scope: ["markup.quote"], style: { foreground: c.markdownBlockQuote, italic: true } },
                { scope: ["markup.raw"], style: { foreground: c.markdownCode, background: c.markdownCodeBackground } },
                { scope: ["markup.raw.inline"], style: { foreground: c.markdownCode, background: c.markdownCodeBackground } },
                { scope: ["markup.raw.block"], style: { foreground: c.markdownCodeBlock } },
                { scope: ["markup.link"], style: { foreground: c.markdownLink, underline: true } },
                { scope: ["markup.link.label"], style: { foreground: c.markdownLinkText, underline: true } },
                { scope: ["markup.link.url"], style: { foreground: c.markdownLink, underline: true } },
                { scope: ["label"], style: { foreground: c.markdownLinkText } },
                { scope: ["string.special", "string.special.url"], style: { foreground: c.markdownLink, underline: true } },
                { scope: ["markup.strikethrough"], style: { foreground: c.textMuted } },
                { scope: ["markup.underline"], style: { foreground: c.text, underline: true } },
                { scope: ["markup.list.checked"], style: { foreground: c.success } },
                { scope: ["markup.list.unchecked"], style: { foreground: c.textMuted } },
                { scope: ["markup.rule"], style: { foreground: c.markdownHorizontalRule } },
                { scope: ["conceal"], style: { foreground: c.textMuted } },
                { scope: ["comment"], style: { foreground: c.syntaxComment, italic: true } },
                { scope: ["keyword"], style: { foreground: c.syntaxKeyword } },
                { scope: ["function"], style: { foreground: c.syntaxFunction } },
                { scope: ["variable"], style: { foreground: c.syntaxVariable } },
                { scope: ["string"], style: { foreground: c.syntaxString } },
                { scope: ["number"], style: { foreground: c.syntaxNumber } },
                { scope: ["type"], style: { foreground: c.syntaxType } },
                { scope: ["operator"], style: { foreground: c.syntaxOperator } },
                { scope: ["punctuation"], style: { foreground: c.syntaxPunctuation } },
        ])
}

export const markdownSyntaxStyles: Record<ThemeName, SyntaxStyle> = {
        dark: createMarkdownSyntaxStyle(darkColors),
        light: createMarkdownSyntaxStyle(lightColors),
}
