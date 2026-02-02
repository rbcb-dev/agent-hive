import{j as n}from"./iframe-BGd1DeQh.js";import"./preload-helper-PPVm8Dsz.js";function j({annotation:e,oldCode:t,uri:o,range:a,onApply:x,isApplied:k,isApplying:D=!1,hasConflict:T=!1}){if(!e.suggestion)return null;const R=e.suggestion.replacement,S=a.start.line+1,V=()=>{x(e.id)},N=D||T;return n.jsxs("div",{className:"suggestion-preview",role:"region","aria-label":"Suggestion preview",children:[n.jsxs("div",{className:"suggestion-header",children:[n.jsxs("span",{className:"suggestion-location",children:[n.jsx("span",{className:"suggestion-file",children:o}),n.jsxs("span",{className:"suggestion-line",children:["line ",S]})]}),k?n.jsx("span",{className:"suggestion-applied-badge",children:"Applied"}):n.jsx("button",{className:"suggestion-apply-btn",onClick:V,disabled:N,"aria-label":"Apply suggestion",children:D?"Applying...":"Apply"})]}),T&&n.jsxs("div",{className:"suggestion-conflict-warning",role:"alert",children:[n.jsx("span",{className:"conflict-icon",children:"⚠️"}),n.jsx("span",{children:"Conflict detected: File has changed since this suggestion was created."})]}),n.jsx("div",{className:"suggestion-description",children:e.body}),n.jsxs("div",{className:"suggestion-diff",children:[n.jsxs("div",{className:"suggestion-line suggestion-line-remove",children:[n.jsx("span",{className:"suggestion-line-prefix",children:"-"}),n.jsx("span",{className:"suggestion-line-content",children:t})]}),n.jsxs("div",{className:"suggestion-line suggestion-line-add",children:[n.jsx("span",{className:"suggestion-line-prefix",children:"+"}),n.jsx("span",{className:"suggestion-line-content",children:R})]})]})]})}let I=0;function E(e="mock"){return`${e}-${Date.now()}-${++I}`}function W(){return new Date().toISOString()}function r(e={}){const t=W();return{id:e.id??E("annotation"),type:e.type??"comment",body:e.body??"This is a mock annotation body.",author:e.author??{type:"human",name:"Reviewer"},createdAt:e.createdAt??t,updatedAt:e.updatedAt??t,suggestion:e.suggestion,meta:e.meta}}const{fn:i,expect:s,within:w,userEvent:B}=__STORYBOOK_MODULE_TEST__,P={title:"Components/SuggestionPreview",component:j,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{isApplied:{control:"boolean",description:"Whether the suggestion has been applied"},isApplying:{control:"boolean",description:"Whether the suggestion is currently being applied"},hasConflict:{control:"boolean",description:"Whether there is a conflict with the current file state"}}},l={start:{line:10,character:0},end:{line:10,character:20}},b=r({id:"suggestion-1",type:"suggestion",body:"Consider using a more descriptive variable name for clarity.",suggestion:{replacement:"const userDisplayName = user.name;"},author:{type:"llm",name:"Claude",agentId:"claude-reviewer"}}),v="const x = user.name;",C="src/components/UserProfile.tsx",c={args:{annotation:b,oldCode:v,uri:C,range:l,onApply:i(),isApplied:!1,isApplying:!1,hasConflict:!1}},p={args:{annotation:r({id:"suggestion-replace",type:"suggestion",body:"Use template literals for better readability.",suggestion:{replacement:"const greeting = `Hello, ${name}!`;"},author:{type:"human",name:"Senior Dev"}}),oldCode:"const greeting = 'Hello, ' + name + '!';",uri:"src/utils/greetings.ts",range:{start:{line:5,character:0},end:{line:5,character:35}},onApply:i(),isApplied:!1}},d={args:{annotation:r({id:"suggestion-applied",type:"suggestion",body:"This suggestion was applied successfully.",suggestion:{replacement:"const result = await fetchData();"}}),oldCode:"const result = fetchData();",uri:"src/api/client.ts",range:{start:{line:42,character:0},end:{line:42,character:28}},onApply:i(),isApplied:!0}},u={args:{annotation:b,oldCode:v,uri:C,range:l,onApply:i(),isApplied:!1,isApplying:!0,hasConflict:!1}},g={args:{annotation:r({id:"suggestion-conflict",type:"suggestion",body:"Replace deprecated API usage.",suggestion:{replacement:'import { useQuery } from "@tanstack/react-query";'}}),oldCode:'import { useQuery } from "react-query";',uri:"src/hooks/useData.ts",range:{start:{line:1,character:0},end:{line:1,character:40}},onApply:i(),isApplied:!1,isApplying:!1,hasConflict:!0}},y={args:{annotation:r({id:"suggestion-multiline",type:"suggestion",body:"Consider extracting this into a separate function for reusability.",suggestion:{replacement:`const processItems = (items) => {
  return items
    .filter(item => item.active)
    .map(item => item.value);
};`}}),oldCode:"const result = items.filter(i => i.active).map(i => i.value);",uri:"src/utils/processing.ts",range:{start:{line:15,character:0},end:{line:15,character:60}},onApply:i(),isApplied:!1}},m={args:{annotation:b,oldCode:v,uri:C,range:l,onApply:i(),isApplied:!1,isApplying:!1,hasConflict:!1},play:async({canvasElement:e,args:t})=>{const a=w(e).getByRole("button",{name:/Apply/i});await B.click(a),await s(t.onApply).toHaveBeenCalledWith("suggestion-1")}},f={args:{annotation:b,oldCode:v,uri:C,range:l,onApply:i(),isApplied:!1,isApplying:!0,hasConflict:!1},play:async({canvasElement:e,args:t})=>{const a=w(e).getByRole("button",{name:/Applying/i});await s(a).toBeDisabled(),await B.click(a),await s(t.onApply).not.toHaveBeenCalled()}},h={args:{annotation:r({id:"suggestion-conflict-test",type:"suggestion",body:"Test conflict scenario.",suggestion:{replacement:"new code"}}),oldCode:"old code",uri:"src/test.ts",range:l,onApply:i(),isApplied:!1,isApplying:!1,hasConflict:!0},play:async({canvasElement:e,args:t})=>{const o=w(e),a=o.getByRole("button",{name:/Apply/i});await s(a).toBeDisabled();const x=o.getByRole("alert");await s(x).toBeInTheDocument(),await B.click(a),await s(t.onApply).not.toHaveBeenCalled()}},A={args:{annotation:r({id:"suggestion-diff-verify",type:"suggestion",body:"Verify diff rendering.",suggestion:{replacement:"const newValue = 42;"}}),oldCode:"const oldValue = 0;",uri:"src/values.ts",range:l,onApply:i(),isApplied:!1},play:async({canvasElement:e})=>{const t=w(e);await s(t.getByText("const oldValue = 0;")).toBeInTheDocument(),await s(t.getByText("const newValue = 42;")).toBeInTheDocument();const o=t.getByText("-"),a=t.getByText("+");await s(o).toBeInTheDocument(),await s(a).toBeInTheDocument()}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: false
  }
}`,...c.parameters?.docs?.source},description:{story:"Default state showing a suggestion with apply button",...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-replace',
      type: 'suggestion',
      body: 'Use template literals for better readability.',
      suggestion: {
        replacement: 'const greeting = \`Hello, \${name}!\`;'
      },
      author: {
        type: 'human',
        name: 'Senior Dev'
      }
    }),
    oldCode: "const greeting = 'Hello, ' + name + '!';",
    uri: 'src/utils/greetings.ts',
    range: {
      start: {
        line: 5,
        character: 0
      },
      end: {
        line: 5,
        character: 35
      }
    },
    onApply: fn(),
    isApplied: false
  }
}`,...p.parameters?.docs?.source},description:{story:"Suggestion with a replacement that shows the before/after diff",...p.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-applied',
      type: 'suggestion',
      body: 'This suggestion was applied successfully.',
      suggestion: {
        replacement: 'const result = await fetchData();'
      }
    }),
    oldCode: 'const result = fetchData();',
    uri: 'src/api/client.ts',
    range: {
      start: {
        line: 42,
        character: 0
      },
      end: {
        line: 42,
        character: 28
      }
    },
    onApply: fn(),
    isApplied: true
  }
}`,...d.parameters?.docs?.source},description:{story:'Suggestion that has already been applied - shows "Applied" badge',...d.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: true,
    hasConflict: false
  }
}`,...u.parameters?.docs?.source},description:{story:'Suggestion that is currently being applied - button shows "Applying..."',...u.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-conflict',
      type: 'suggestion',
      body: 'Replace deprecated API usage.',
      suggestion: {
        replacement: 'import { useQuery } from "@tanstack/react-query";'
      }
    }),
    oldCode: 'import { useQuery } from "react-query";',
    uri: 'src/hooks/useData.ts',
    range: {
      start: {
        line: 1,
        character: 0
      },
      end: {
        line: 1,
        character: 40
      }
    },
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: true
  }
}`,...g.parameters?.docs?.source},description:{story:"Suggestion with a conflict warning - apply button is disabled",...g.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-multiline',
      type: 'suggestion',
      body: 'Consider extracting this into a separate function for reusability.',
      suggestion: {
        replacement: \`const processItems = (items) => {
  return items
    .filter(item => item.active)
    .map(item => item.value);
};\`
      }
    }),
    oldCode: 'const result = items.filter(i => i.active).map(i => i.value);',
    uri: 'src/utils/processing.ts',
    range: {
      start: {
        line: 15,
        character: 0
      },
      end: {
        line: 15,
        character: 60
      }
    },
    onApply: fn(),
    isApplied: false
  }
}`,...y.parameters?.docs?.source},description:{story:"Multi-line code replacement suggestion",...y.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: false
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);

    // Find and click the Apply button
    const applyButton = canvas.getByRole('button', {
      name: /Apply/i
    });
    await userEvent.click(applyButton);

    // Verify the callback was called with the annotation ID
    await expect(args.onApply).toHaveBeenCalledWith('suggestion-1');
  }
}`,...m.parameters?.docs?.source},description:{story:"Test that clicking Apply button triggers onApply callback with annotation ID",...m.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: true,
    hasConflict: false
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);

    // Find the Apply button
    const applyButton = canvas.getByRole('button', {
      name: /Applying/i
    });

    // Verify the button is disabled
    await expect(applyButton).toBeDisabled();

    // Try clicking anyway
    await userEvent.click(applyButton);

    // Verify callback was NOT called
    await expect(args.onApply).not.toHaveBeenCalled();
  }
}`,...f.parameters?.docs?.source},description:{story:"Test that Apply button is disabled when applying",...f.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-conflict-test',
      type: 'suggestion',
      body: 'Test conflict scenario.',
      suggestion: {
        replacement: 'new code'
      }
    }),
    oldCode: 'old code',
    uri: 'src/test.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: true
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);

    // Find the Apply button
    const applyButton = canvas.getByRole('button', {
      name: /Apply/i
    });

    // Verify the button is disabled
    await expect(applyButton).toBeDisabled();

    // Verify conflict warning is shown
    const conflictWarning = canvas.getByRole('alert');
    await expect(conflictWarning).toBeInTheDocument();

    // Try clicking anyway
    await userEvent.click(applyButton);

    // Verify callback was NOT called
    await expect(args.onApply).not.toHaveBeenCalled();
  }
}`,...h.parameters?.docs?.source},description:{story:"Test that Apply button is disabled when there's a conflict",...h.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-diff-verify',
      type: 'suggestion',
      body: 'Verify diff rendering.',
      suggestion: {
        replacement: 'const newValue = 42;'
      }
    }),
    oldCode: 'const oldValue = 0;',
    uri: 'src/values.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);

    // Verify old code is displayed
    await expect(canvas.getByText('const oldValue = 0;')).toBeInTheDocument();

    // Verify new code is displayed
    await expect(canvas.getByText('const newValue = 42;')).toBeInTheDocument();

    // Verify diff prefixes are present
    const minusPrefix = canvas.getByText('-');
    const plusPrefix = canvas.getByText('+');
    await expect(minusPrefix).toBeInTheDocument();
    await expect(plusPrefix).toBeInTheDocument();
  }
}`,...A.parameters?.docs?.source},description:{story:"Verify diff display shows old code with minus prefix and new code with plus prefix",...A.parameters?.docs?.description}}};const H=["Default","WithReplacement","Applied","Applying","WithConflict","MultiLineReplacement","ClickApply","ApplyButtonDisabledWhileApplying","ApplyButtonDisabledWithConflict","DiffDisplayVerification"];export{d as Applied,f as ApplyButtonDisabledWhileApplying,h as ApplyButtonDisabledWithConflict,u as Applying,m as ClickApply,c as Default,A as DiffDisplayVerification,y as MultiLineReplacement,g as WithConflict,p as WithReplacement,H as __namedExportsOrder,P as default};
