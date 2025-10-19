document.addEventListener("DOMContentLoaded", () => {
  const projectInput = document.getElementById("project-input");
  const generateBtn = document.getElementById("generate-roadmap");
  const outputDiv = document.getElementById("output");

  // Function to initialize AI session and generate roadmap
  async function generateRoadmap() {
    try {
      // Step 0: Show loading message
      outputDiv.textContent = "⏳ Generating roadmap, please wait...";

      // Step 1: Get model parameters and availability
      const { available, defaultTemperature, defaultTopK } = await LanguageModel.params();

      if (available === "no") {
        outputDiv.textContent = "❌ Gemini Nano API not available on this device/context.";
        return;
      }

      // Step 2: Require user interaction to create session
      if (!navigator.userActivation.isActive) {
        outputDiv.textContent = "⚠️ Click the button to start AI session.";
        return;
      }

      // Step 3: Create AI session
      const session = await LanguageModel.create({
        temperature: defaultTemperature,
        topK: defaultTopK
      });

      // Step 4: Prompt the model with the user input
      const userProject = projectInput.value.trim();
      if (!userProject) {
        outputDiv.textContent = "Please enter a project idea first.";
        return;
      }

      const promptText = `Create a roadmap for the following project idea: ${userProject}`;
      
      // Step 4a: Optional streaming to show partial output (if supported)
      // For now, simple prompt with "Generating..." message
      //const result = await session.prompt(promptText);
      const schema = {
        type: "object",
        properties: {
          roadmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "string" },
                description: { type: "string" }
              },
              required: ["step", "description"]
            }
          }
        },
        required: ["roadmap"]
};

const result = await session.prompt(
  `Create a structured roadmap for this project: ${userProject}. Return JSON with steps and descriptions.`,
  { responseConstraint: schema }
);

const parsed = JSON.parse(result);
console.log(parsed.roadmap);



      // Step 5: Display AI output
      //outputDiv.textContent = result;
      // Reference to the output container
      

      // Clear any previous results
      outputDiv.innerHTML = "";

      // Check that parsed.roadmap exists and has content
      if (parsed.roadmap && parsed.roadmap.length > 0) {
        const list = document.createElement("ul");

        parsed.roadmap.forEach((stepObj, index) => {
          const item = document.createElement("li");
          item.innerHTML = `<b>Step ${index + 1}:</b> ${stepObj.step}<br><i>${stepObj.description}</i>`;
          list.appendChild(item);
        });

        outputDiv.appendChild(list);
      } else {
        outputDiv.textContent = "No roadmap generated.";
      }


      // Optional: destroy session after use
      session.destroy();

    } catch (error) {
      console.error("Error generating roadmap:", error);
      outputDiv.textContent = "❌ Error generating roadmap. See console for details.";
    }
  }

  // Bind generate button click
  generateBtn.addEventListener("click", generateRoadmap);
});
