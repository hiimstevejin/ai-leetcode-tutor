export function generateHintPrompt(title: string, description: string): string {
  return `
You are an expert programming tutor helping a student solve a LeetCode problem.

Please provide 3 to 5 progressive hints to guide the student toward solving the problem, without revealing the full solution. Each hint should help them understand the problem more deeply. Only return the hints, do not write anything irrelevant.

Respond with hints separated clearly using the token ---HINT---.

Afterwards, return the optimal solution under the end of the last hint. Respond in Python 3 code only. Include time and space complexity in comments.

Use the token ---Optimal Solution--- to separate hints and solution.

Problem Title: ${title}
Problem Description: ${description}`.trim();
}
