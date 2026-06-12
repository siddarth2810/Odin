import { SyntaxStyle, ansi256IndexToRgb } from "@opentui/core"

function hexByte(value: number): string {
        return value.toString(16).padStart(2, "0")
}

function ansi256Hex(index: number): string {
        const [red, green, blue] = ansi256IndexToRgb(index)
        return `#${hexByte(red)}${hexByte(green)}${hexByte(blue)}`
}

export const mdLight = {
        h1: ansi256Hex(125),
        h2: ansi256Hex(125),
        h3: ansi256Hex(31),
        bullet: ansi256Hex(166),
        link: ansi256Hex(26),
        codeFg: ansi256Hex(124),
        codeBg: ansi256Hex(124),
        fence: ansi256Hex(28),
        dim: ansi256Hex(242),
        note: ansi256Hex(25),
        tip: ansi256Hex(28),
        important: ansi256Hex(91),
        warning: ansi256Hex(130),
        caution: ansi256Hex(160),
}

export const mdDark = {
        h1: ansi256Hex(213),
        h2: ansi256Hex(213),
        h3: ansi256Hex(45),
        bullet: ansi256Hex(208),
        link: ansi256Hex(39),
        codeFg: ansi256Hex(215),
        codeBg: ansi256Hex(236),
        fence: ansi256Hex(114),
        dim: ansi256Hex(244),
        note: ansi256Hex(75),
        tip: ansi256Hex(78),
        important: ansi256Hex(141),
        warning: ansi256Hex(179),
        caution: ansi256Hex(203),
}

type MdrPalette = typeof mdLight
type Scheme = "dark" | "light"

function buildColors(md: MdrPalette, scheme: Scheme) {
        const isDark = scheme === "dark"
        const text = isDark ? "#eeeeee" : "#1c1c1c"
        const background = isDark ? "#0a0a0a" : "#ffffff"

        return {
                background,
                backgroundPanel: "#141414",
                backgroundElement: background,
                buttonBackground: isDark ? "#303030" : md.codeBg,
                borderSubtle: md.dim,
                border: md.dim,
                borderActive: md.link,
                primary: md.bullet,
                secondary: md.link,
                accent: md.h1,
                error: md.caution,
                warning: md.warning,
                success: md.tip,
                info: md.note,
                text,
                textMuted: md.dim,
                markdownText: text,
                markdownHeading: md.h1,
                markdownLink: "#fab283",
                markdownLinkText: "#56b6c2",
                markdownCode: "#7fd88f",
                markdownCodeBackground: md.codeBg,
                markdownCodeBlockBackground: isDark ? md.codeBg : "#FCFAFB",
                markdownCodeBlock: md.fence,
                markdownCodeBorder: md.dim,
                markdownBlockQuote: md.dim,
                markdownEmph: md.warning,
                markdownStrong: md.warning,
                markdownHorizontalRule: md.dim,
                markdownListItem: md.bullet,
                markdownListEnumeration: md.bullet,
                markdownImage: md.link,
                markdownImageText: md.link,
                syntaxComment: md.dim,
                syntaxKeyword: md.important,
                syntaxFunction: md.h3,
                syntaxVariable: text,
                syntaxString: md.tip,
                syntaxNumber: md.warning,
                syntaxType: md.note,
                syntaxOperator: md.h3,
                syntaxPunctuation: md.dim,
        }
}

export const darkColors = buildColors(mdDark, "dark")
export const lightColors = buildColors(mdLight, "light")
export const themes = {
        dark: darkColors,
        light: lightColors,
}

export type ThemeName = keyof typeof themes
export type Colors = typeof darkColors

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

export function markdownSyntax(c: Colors = colors) {
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
                { scope: ["markup.raw", "markup.raw.block"], style: { foreground: c.markdownCodeBlock } },
                { scope: ["markup.raw.inline"], style: { foreground: c.markdownCode, background: c.markdownCodeBackground } },
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
                { scope: ["string"], style: { foreground: c.syntaxString } },
                { scope: ["number"], style: { foreground: c.syntaxNumber } },
                { scope: ["type"], style: { foreground: c.syntaxType } },
                { scope: ["operator"], style: { foreground: c.syntaxOperator } },
                { scope: ["punctuation"], style: { foreground: c.syntaxPunctuation } },
        ])
}

export const markdownSyntaxStyles: Record<ThemeName, SyntaxStyle> = {
        dark: markdownSyntax(darkColors),
        light: markdownSyntax(lightColors),
}
