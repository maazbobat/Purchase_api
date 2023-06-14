const express = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

app.listen(3000, () => console.log('Running'))

app.get('/api/total_items', (req, res) => {
    const { start_date, end_date, department } = req.query;
    const start = new Date(start_date);
    const end = new Date(end_date);
    const dept = department ? department.toLowerCase():"";

    if (!start_date || !end_date || !department) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    const filePath = 'data.csv';
    let totalItems = 0;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            // Check if the row matches the given criteria
            const saleDate = new Date(row.date);
            const rowDepartment = row.department ? row.department.toLowerCase():"";

            if (
                saleDate >= start &&
                saleDate <= end &&
                rowDepartment === dept
            ) {
                console.log(totalItems)
                totalItems += parseInt(row.seats);
            }
        })
        .on('end', () => {
            res.json({ totalItems });
            console.log(totalItems);

        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error processing CSV file' });
        });
});

app.get('/api/nth_most_total_item', (req, res) => {
    const { item_by, start_date, end_date, n } = req.query;
    const start = new Date(start_date);
    const end = new Date(end_date);

    // Validate the required parameters
    if (!item_by || !start_date || !end_date || !n) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Decode the date values
    const filePath = 'data.csv';
    const items = {};
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const saleDate = new Date(row.date);
            if (
                saleDate >= start && saleDate <= end
            ) {



                // Check if the row matches the given quarter and department
                const itemName = row.software;
                const quantity = parseInt(row.seats);
                const price = parseFloat(row.amount);

                if (item_by === 'quantity') {
                    items[itemName] = items[itemName] ? items[itemName] + quantity : quantity;
                } else if (item_by === 'price') {
                    items[itemName] = items[itemName] ? items[itemName] + price : price;
                }
            }
        })
        .on('end', () => {
            // Sort the items based on the quantity or price
            const sortedItems = Object.entries(items).sort((a, b) => b[1] - a[1]);

            if (sortedItems.length >= n) {
                const nthItem = sortedItems[n - 1][0]; // Get the nth item name

                res.json({ item: nthItem });
            } else {
                res.status(404).json({ error: 'Nth item not found' });
            }
        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error processing CSV file' });

        });
});

app.get('/api/percentage_of_department_wise_sold_items', (req, res) => {
    const { start_date, end_date } = req.query;

    // Validate the required parameters
    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    const filePath = 'data.csv';
    const departments = {};
    let totalItems = 0;
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const saleDate = new Date(row.date);
            const rowDepartment = row.department.toLowerCase();

            // Check if the row matches the given date range
            if (
                saleDate >= new Date(start_date) &&
                saleDate <= new Date(end_date)
            ) {
                const quantity = parseInt(row.seats);

                // Increment the total quantity sold for the department
                departments[rowDepartment] = departments[rowDepartment]
                    ? departments[rowDepartment] + quantity
                    : quantity;

                totalItems += quantity;
            }
        })
        .on('end', () => {
            const percentages = {};

            // Calculate the percentage of sold items for each department
            for (const department in departments) {
                const percentage = ((departments[department] / totalItems) * 100).toFixed(2);
                percentages[department] = `${percentage}%`;
            }

            res.json(percentages);
        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error processing CSV file' });
        });
});

app.get('/api/monthly_sales', (req, res) => {
    const { product } = req.query;

    // Validate the required parameters
    if (!product) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    const filePath = './data.csv';
    const monthlySales = new Array(12).fill(0);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const saleDate = new Date(row.date);
            const rowProduct = row.software.toLowerCase();
            // Check if the row matches the given product
            if (rowProduct === product.toLowerCase()) {
                const month = saleDate.getMonth();
                const quantity = parseInt(row.seats);
                const price = parseFloat(row.amount);

                // Accumulate the sales for the corresponding month
                monthlySales[month] += quantity * price;
            }
        })
        .on('end', () => {
            res.json(monthlySales);
        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error processing CSV file' });
        });
});
