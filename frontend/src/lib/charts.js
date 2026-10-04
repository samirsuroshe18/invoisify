import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';

// the pieces of Chart.js the dashboard draws with, registered once
ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);
