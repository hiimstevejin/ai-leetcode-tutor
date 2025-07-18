export function generateHintPrompt(
  title: string,
  description: string,
  codingLanguage: string
): string {
  return `
You are an expert programming tutor helping a student solve a LeetCode problem step by step.

First, provide 3 to 5 progressively deeper hints to guide the student toward solving the problem on their own. Each hint should build on the previous one, increasing in specificity. Do not reveal code or pseudocode in the hints. Focus on helping the student think critically about the algorithm and problem structure.

Separate each hint with the token ---HINT---. and start each hint with HINT (hintnumber)

After all hints have been provided, return the optimal solution inside a properly formatted ${codingLanguage} class. Only include the function body (not test code or print statements). Use ${codingLanguage} syntax.

Separate the hints and the code using the token ---Optimal Solution---.

Include time and space complexity in comments above the function.


Problem Title: ${title}
Problem Description: ${description}`.trim();
}
