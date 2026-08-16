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
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@platejs/code-block/react";
import { IndentPlugin } from "@platejs/indent/react";
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
  H1Plugin.withComponent(H1Element),
  H2Plugin.withComponent(H2Element),
  H3Plugin.withComponent(H3Element),
  BlockquotePlugin.withComponent(BlockquoteElement),
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  CodePlugin.withComponent(InlineCodeLeaf),
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
  LinkPlugin.withComponent(LinkElement),
  CodeBlockPlugin.withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm],
    },
  }),
];
