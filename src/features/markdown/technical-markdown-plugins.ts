import {
  BlockquoteRules,
  BoldRules,
  CodeRules,
  HeadingRules,
  ItalicRules,
  MarkComboRules,
  StrikethroughRules,
} from "@platejs/basic-nodes";
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
} from "@platejs/basic-nodes/react";
import { CodeBlockRules } from "@platejs/code-block";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@platejs/code-block/react";
import { IndentPlugin } from "@platejs/indent/react";
import { LinkRules } from "@platejs/link";
import { LinkPlugin } from "@platejs/link/react";
import {
  BulletedListRules,
  OrderedListRules,
  TaskListRules,
} from "@platejs/list";
import { ListPlugin } from "@platejs/list/react";
import { MarkdownPlugin } from "@platejs/markdown";
import { KEYS } from "platejs";
import { ParagraphPlugin } from "platejs/react";
import remarkGfm from "remark-gfm";

import {
  BlockquoteElement,
  CodeBlockElement,
  CodeLineElement,
  CodeSyntaxLeaf,
  H1Element,
  H2Element,
  H3Element,
  InlineCodeLeaf,
  LinkElement,
  MarkdownBlockList,
  ParagraphElement,
} from "./technical-markdown-components.js";

const listTargetPlugins = [
  ...KEYS.heading,
  KEYS.p,
  KEYS.blockquote,
  KEYS.codeBlock,
];

export const technicalMarkdownPlugins = [
  ParagraphPlugin.withComponent(ParagraphElement),
  H1Plugin.configure({
    inputRules: [HeadingRules.markdown()],
  }).withComponent(H1Element),
  H2Plugin.configure({
    inputRules: [HeadingRules.markdown()],
  }).withComponent(H2Element),
  H3Plugin.configure({
    inputRules: [HeadingRules.markdown()],
  }).withComponent(H3Element),
  BlockquotePlugin.configure({
    inputRules: [BlockquoteRules.markdown()],
  }).withComponent(BlockquoteElement),
  BoldPlugin.configure({
    inputRules: [
      BoldRules.markdown({ variant: "*" }),
      BoldRules.markdown({ variant: "_" }),
      MarkComboRules.markdown({ variant: "boldItalic" }),
    ],
  }),
  ItalicPlugin.configure({
    inputRules: [
      ItalicRules.markdown({ variant: "*" }),
      ItalicRules.markdown({ variant: "_" }),
    ],
  }),
  StrikethroughPlugin.configure({
    inputRules: [StrikethroughRules.markdown()],
  }),
  CodePlugin.configure({
    inputRules: [CodeRules.markdown()],
  }).withComponent(InlineCodeLeaf),
  IndentPlugin.configure({
    inject: {
      targetPlugins: listTargetPlugins,
    },
  }),
  ListPlugin.configure({
    inputRules: [
      BulletedListRules.markdown({ variant: "-" }),
      BulletedListRules.markdown({ variant: "*" }),
      OrderedListRules.markdown({ variant: "." }),
      TaskListRules.markdown({ checked: false }),
      TaskListRules.markdown({ checked: true }),
    ],
    inject: {
      targetPlugins: listTargetPlugins,
    },
    render: {
      belowNodes: MarkdownBlockList,
    },
  }),
  LinkPlugin.configure({
    inputRules: [LinkRules.markdown()],
  }).withComponent(LinkElement),
  CodeBlockPlugin.configure({
    inputRules: [CodeBlockRules.markdown({ on: "break" })],
  }).withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm],
    },
  }),
];
