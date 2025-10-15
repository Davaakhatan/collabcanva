import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

// Shape types supported
export type ShapeCommand = {
  action: 'create' | 'modify' | 'delete' | 'arrange';
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse';
  properties?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    rotation?: number;
    text?: string;
    fontSize?: number;
  };
  targets?: string[]; // IDs of shapes to modify
  layoutType?: 'grid' | 'horizontal' | 'vertical' | 'center';
  layoutParams?: {
    rows?: number;
    cols?: number;
    spacing?: number;
    count?: number;
  };
};

export type AICommandResult = {
  commands: ShapeCommand[];
  explanation: string;
};

const SYSTEM_PROMPT = `You are an AI assistant for a collaborative canvas application. Users can give you natural language commands to create, modify, arrange, or delete shapes on the canvas.

The canvas is 3000x2000 pixels. Common positions:
- Top-left: (100, 100)
- Center: (1500, 1000)
- Top-center: (1500, 200)

Available shape types: rectangle, circle, triangle, text, ellipse

Available actions:
1. CREATE: Make new shapes with specific properties
2. MODIFY: Change existing shapes (resize, move, rotate, recolor)
3. DELETE: Remove shapes
4. ARRANGE: Layout multiple shapes (grid, horizontal, vertical, center)

You must respond with ONLY valid JSON in this exact format:
{
  "commands": [
    {
      "action": "create",
      "shapeType": "rectangle",
      "properties": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 150,
        "fill": "#FF5733",
        "rotation": 0
      }
    }
  ],
  "explanation": "Created a red rectangle at position (100, 100)"
}

For complex commands (like "create a login form"), break them into multiple create commands with proper positioning.

Examples:

User: "Create a red circle at 500, 300"
{
  "commands": [{
    "action": "create",
    "shapeType": "circle",
    "properties": {"x": 500, "y": 300, "width": 100, "height": 100, "fill": "#FF0000"}
  }],
  "explanation": "Created a red circle at (500, 300)"
}

User: "Make a 3x3 grid of blue squares"
{
  "commands": [{
    "action": "arrange",
    "shapeType": "rectangle",
    "layoutType": "grid",
    "layoutParams": {"rows": 3, "cols": 3, "count": 9, "spacing": 20},
    "properties": {"x": 500, "y": 300, "width": 80, "height": 80, "fill": "#0066FF"}
  }],
  "explanation": "Created a 3x3 grid of blue squares"
}

User: "Create a login form"
{
  "commands": [
    {
      "action": "create",
      "shapeType": "text",
      "properties": {"x": 700, "y": 400, "text": "Login", "fontSize": 32, "fill": "#333333"}
    },
    {
      "action": "create",
      "shapeType": "rectangle",
      "properties": {"x": 650, "y": 460, "width": 300, "height": 50, "fill": "#FFFFFF"}
    },
    {
      "action": "create",
      "shapeType": "text",
      "properties": {"x": 660, "y": 470, "text": "Username", "fontSize": 16, "fill": "#888888"}
    },
    {
      "action": "create",
      "shapeType": "rectangle",
      "properties": {"x": 650, "y": 530, "width": 300, "height": 50, "fill": "#FFFFFF"}
    },
    {
      "action": "create",
      "shapeType": "text",
      "properties": {"x": 660, "y": 540, "text": "Password", "fontSize": 16, "fill": "#888888"}
    },
    {
      "action": "create",
      "shapeType": "rectangle",
      "properties": {"x": 700, "y": 600, "width": 200, "height": 50, "fill": "#0066FF"}
    },
    {
      "action": "create",
      "shapeType": "text",
      "properties": {"x": 760, "y": 615, "text": "Submit", "fontSize": 18, "fill": "#FFFFFF"}
    }
  ],
  "explanation": "Created a login form with username, password fields, and submit button"
}

IMPORTANT: 
- Always return valid JSON only, no markdown or extra text
- Use specific numeric values, not placeholders
- For text shapes, include both text content and fontSize
- Ensure coordinates keep shapes visible on canvas (0-3000 x, 0-2000 y)
- Use hex color codes (e.g., #FF5733)
`;

export async function executeAICommand(userCommand: string): Promise<AICommandResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userCommand },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const result = JSON.parse(content) as AICommandResult;
    
    // Validate response structure
    if (!result.commands || !Array.isArray(result.commands)) {
      throw new Error('Invalid AI response structure');
    }

    return result;
  } catch (error) {
    console.error('AI command error:', error);
    
    // Return error as a user-friendly message
    return {
      commands: [],
      explanation: `Sorry, I couldn't understand that command. Try something like: "Create a red circle at 500, 300" or "Make a 3x3 grid of squares"`,
    };
  }
}

// Execute shape commands on the canvas
export function executeShapeCommands(
  commands: ShapeCommand[],
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse', overrides?: any) => void
): void {
  commands.forEach((cmd) => {
    if (cmd.action === 'create') {
      if (cmd.shapeType === 'text') {
        // Create text shape
        addShape('text', cmd.properties || {});
      } else if (cmd.layoutType) {
        // Create multiple shapes in a layout
        createLayout(cmd, addShape);
      } else {
        // Create single shape
        addShape(cmd.shapeType || 'rectangle', cmd.properties || {});
      }
    }
    // TODO: Implement modify, delete, arrange actions
  });
}

function createLayout(
  cmd: ShapeCommand,
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse', overrides?: any) => void
): void {
  const { layoutType, layoutParams, shapeType, properties } = cmd;
  const count = layoutParams?.count || 1;
  const spacing = layoutParams?.spacing || 20;
  const baseProps = properties || {};

  if (layoutType === 'grid') {
    const rows = layoutParams?.rows || Math.ceil(Math.sqrt(count));
    const cols = layoutParams?.cols || Math.ceil(count / rows);
    const shapeWidth = baseProps.width || 80;
    const shapeHeight = baseProps.height || 80;
    const startX = baseProps.x || 500;
    const startY = baseProps.y || 300;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (shapeWidth + spacing);
      const y = startY + row * (shapeHeight + spacing);

      addShape(shapeType || 'rectangle', {
        ...baseProps,
        x,
        y,
      });
    }
  } else if (layoutType === 'horizontal') {
    const shapeWidth = baseProps.width || 100;
    const startX = baseProps.x || 500;
    const startY = baseProps.y || 500;

    for (let i = 0; i < count; i++) {
      addShape(shapeType || 'rectangle', {
        ...baseProps,
        x: startX + i * (shapeWidth + spacing),
        y: startY,
      });
    }
  } else if (layoutType === 'vertical') {
    const shapeHeight = baseProps.height || 100;
    const startX = baseProps.x || 500;
    const startY = baseProps.y || 300;

    for (let i = 0; i < count; i++) {
      addShape(shapeType || 'rectangle', {
        ...baseProps,
        x: startX,
        y: startY + i * (shapeHeight + spacing),
      });
    }
  }
}

