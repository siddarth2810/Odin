
# Odin-md

#### Terminal-first viewer for Markdown files. Odin uses OpenTUI.

<img width="1520" height="990" alt="screenshot-20260612-131140Z-selected" src="https://github.com/user-attachments/assets/de074b1e-d464-405e-8396-3e73172564f6" />

<img width="1523" height="996" alt="screenshot-20260612-131128Z-selected" src="https://github.com/user-attachments/assets/f1d864ee-dbfa-44a1-83bd-20be8cfb06ed" />


## Install

```bash
npm install -g odin-md
```

## Usage

```bash
odin file.md
```

## Keybindings

| Key | Action |
|-----|--------|
| `t` | Toggle light and dark mode |
| `g` | Jump to top |
| `G` | Jump to bottom |
| `j` | Move down (vim-style) |
| `k` | Move up (vim-style) |


## Development

```bash
bun install
bun run build
bun run dev <Markdown-file-name>.md
```


