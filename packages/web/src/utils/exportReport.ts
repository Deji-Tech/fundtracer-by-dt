import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult } from '@fundtracer/core';

export const generatePDFReport = (result: AnalysisResult) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    // --- Header ---
    doc.setFillColor(10, 10, 15); // Dark background
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FundTracer Investigation Report', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 32);
    doc.text('https://fundtracer.xyz', pageWidth - margin - 35, 32);

    // --- Wallet Overview ---
    let yPos = 55;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Wallet Overview', margin, yPos);
    yPos += 10;

    const riskColor =
        result.riskLevel === 'critical' ? [239, 68, 68] :
            result.riskLevel === 'high' ? [239, 68, 68] :
                result.riskLevel === 'medium' ? [245, 158, 11] : [16, 185, 129];

    doc.setFontSize(10);
    doc.text(`Address: ${result.wallet.address}`, margin, yPos);

    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(`Risk Score: ${result.overallRiskScore} (${result.riskLevel.toUpperCase()})`, margin, yPos + 6);
    doc.setTextColor(0, 0, 0);

    doc.text(`Chain: ${result.wallet.chain.toUpperCase()}`, margin, yPos + 12);
    doc.text(`Balance: ${result.wallet.balanceInEth.toFixed(4)} ETH`, margin, yPos + 18);

    yPos += 30;

    // --- Suspicious Activity ---
    if (result.suspiciousIndicators.length > 0) {
        doc.setFontSize(14);
        doc.text('Suspicious Activity Detected', margin, yPos);
        yPos += 5;

        const suspiciousData = result.suspiciousIndicators.map(indicator => [
            indicator.type.replace(/_/g, ' '),
            indicator.severity.toUpperCase(),
            indicator.score,
            indicator.description
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Indicator', 'Severity', 'Score', 'Description']],
            body: suspiciousData,
            headStyles: { fillColor: [220, 38, 38], textColor: 255 },
            styles: { fontSize: 9 },
            columnStyles: { 3: { cellWidth: 'auto' } }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    }

    // --- Transaction Summary ---
    doc.setFontSize(14);
    doc.text('Transaction Summary', margin, yPos);
    yPos += 5;

    const summaryData = [
        ['Total Transactions', result.summary.totalTransactions.toString()],
        ['Successful / Failed', `${result.summary.successfulTxs} / ${result.summary.failedTxs}`],
        ['Total Received', `+${result.summary.totalValueReceivedEth.toFixed(4)} ETH`],
        ['Total Sent', `-${result.summary.totalValueSentEth.toFixed(4)} ETH`],
        ['Activity Period', `${result.summary.activityPeriodDays} days`],
        ['Unique Interactions', result.summary.uniqueInteractedAddresses.toString()]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [55, 65, 81], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    // --- Recent Transactions ---
    doc.setFontSize(14);
    doc.text(`Recent Transactions (Last ${Math.min(100, result.transactions.length)})`, margin, yPos);
    yPos += 5;

    const txData = result.transactions.slice(0, 100).map((tx: any) => {
        let valueDisplay = '< 0.0001 ETH';
        if (tx.valueInEth > 0.0001) {
            valueDisplay = `${tx.valueInEth.toFixed(4)} ETH`;
        } else if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
            const t = tx.tokenTransfers[0];
            const val = typeof t.valueFormatted === 'number' ? t.valueFormatted : 0;
            valueDisplay = `${val.toFixed(2)} ${t.tokenSymbol}`;
        }

        return [
            '-', // Date replaced with dash per user request
            tx.isIncoming ? 'IN' : 'OUT',
            valueDisplay,
            tx.from === result.wallet.address ? `To: ${tx.to?.slice(0, 8)}...` : `From: ${tx.from.slice(0, 8)}...`,
            tx.toLabel || tx.fromLabel || '-'
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Dir', 'Value', 'Counterparty', 'Label']],
        body: txData,
        headStyles: { fillColor: [55, 65, 81], textColor: 255 },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // --- Save ---
    doc.save(`FundTracer_Report_${result.wallet.address.slice(0, 8)}.pdf`);
};
