export const treeData = {
  id: "root",
  condition: "Glucose > 140?",
  feature: "glucose",
  threshold: 140,
  yes: {
    id: "n1",
    condition: "BMI > 30?",
    feature: "bmi",
    threshold: 30,
    yes: { id: "l1", prediction: "High Risk", risk: "high" },
    no:  { id: "l2", prediction: "Medium Risk", risk: "medium" },
  },
  no: {
    id: "n2",
    condition: "Age > 45?",
    feature: "age",
    threshold: 45,
    yes: { id: "l3", prediction: "Medium Risk", risk: "medium" },
    no:  { id: "l4", prediction: "Low Risk", risk: "low" },
  },
};

export function predict(inputs) {
  const path = [];
  let node = treeData;

  while (!node.prediction) {
    const val = inputs[node.feature];
    const result = val > node.threshold;
    path.push({ nodeId: node.id, condition: node.condition, value: val, result });
    node = result ? node.yes : node.no;
  }

  path.push({ nodeId: node.id, prediction: node.prediction });
  return { prediction: node.prediction, risk: node.risk, path };
}

export const quizQuestions = [
  {
    q: "What does a leaf node represent in a decision tree?",
    options: ["A feature split", "A final prediction", "A branch condition", "A training sample"],
    answer: 1,
  },
  {
    q: "What is overfitting?",
    options: [
      "Model is too simple",
      "Model memorizes training data, fails on new data",
      "Model has low training accuracy",
      "Model uses too few features",
    ],
    answer: 1,
  },
  {
    q: "Random Forest improves decision trees by:",
    options: ["Using deeper trees", "Combining many trees via voting", "Removing all branches", "Using only one feature"],
    answer: 1,
  },
  {
    q: "Which metric helps detect overfitting?",
    options: ["Training accuracy only", "Tree depth", "Gap between train & test accuracy", "Number of features"],
    answer: 2,
  },
  {
    q: "Gradient Boosting builds trees:",
    options: ["In parallel", "Randomly", "Sequentially, correcting previous errors", "Using majority voting"],
    answer: 2,
  },
];