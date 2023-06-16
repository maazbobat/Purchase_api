const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();

// Example dataset
// Replace this with your actual dataset or database access code
const dataset = [];

// Path to the CSV file
const csvFilePath = 'data.csv';

// Load dataset from CSV file
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    dataset.push(data);
  })
  .on('end', () => {
    console.log('Dataset loaded from CSV file');
  });

app.get('/api/total_items', (req, res) => {
  const { start_date, end_date, department } = req.query;

  let totalItems = 0;

  for (const entry of dataset) {
    if (
      entry.department === department &&
      entry.date >= start_date &&
      entry.date <= end_date
    ) {
      totalItems += parseInt(entry.items_sold);
    }
  }

  res.json({ total_items: totalItems });
});

app.get('/api/nth_most_total_item', (req, res) => {
  const { item_by, start_date, end_date, n } = req.query;

  // Filter dataset based on the specified dates
  const filteredDataset = dataset.filter(
    (entry) => entry.date >= start_date && entry.date <= end_date
  );

  let sortedItems;

  if (item_by === 'quantity') {
    sortedItems = filteredDataset.sort((a, b) => b.items_sold - a.items_sold);
  } else if (item_by === 'price') {
    sortedItems = filteredDataset.sort((a, b) => b.total_price - a.total_price);
  } else {
    return res.status(400).json({ error: 'Invalid item_by parameter' });
  }

  if (n <= 0 || n > sortedItems.length) {
    return res.status(400).json({ error: 'Invalid n parameter' });
  }

  const nthItem = sortedItems[n - 1];
  res.json({
    item_name: nthItem.item_name,
    quantity_sold: nthItem.items_sold,
    total_price: nthItem.total_price,
  });
});

app.get('/api/percentage_of_department_wise_sold_items', (req, res) => {
  const { start_date, end_date } = req.query;

  const departmentWiseSoldItems = {};

  for (const entry of dataset) {
    if (entry.date >= start_date && entry.date <= end_date) {
      const department = entry.department;
      if (department in departmentWiseSoldItems) {
        departmentWiseSoldItems[department] += parseInt(entry.items_sold);
      } else {
        departmentWiseSoldItems[department] = parseInt(entry.items_sold);
      }
    }
  }

  const totalItems = Object.values(departmentWiseSoldItems).reduce(
    (sum, count) => sum + count,
    0
  );

  const percentageItems = {};
  for (const [department, count] of Object.entries(departmentWiseSoldItems)) {
    percentageItems[department] = (count / totalItems) * 100;
  }

  res.json(percentageItems);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
