/**
 * Generates "MAQOLALAR NASHRI HAQIDA HISOBOT" as .docx and triggers download.
 * Layout matches the sample: cover with author block, second page with table.
 */
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    BorderStyle,
    WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { NashrHisobotData } from '../components/NashrHisobotCertificate';

export async function downloadNashrHisobotDocx(data: NashrHisobotData): Promise<void> {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'www.ilmiyfaoliyat.uz', bold: true, color: '0A225F' })],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Hujjat yaratilgan sana: ', bold: true }),
                            new TextRun({ text: data.documentDate }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: 'Hujjat raqami: ', bold: true }),
                            new TextRun({ text: data.documentNumber }),
                        ],
                        spacing: { after: 600 },
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "MAQOLALAR NASHRI HAQIDA HISOBOT",
                                bold: true,
                                size: 32,
                                color: '0A225F',
                            }),
                        ],
                        spacing: { before: 400, after: 600 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Muallif familya, ismi, sharifi: ', bold: true }),
                            new TextRun({ text: data.authorFullName }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Muallif ish yoki o'qish joyi: ", bold: true }),
                            new TextRun({ text: data.authorWorkplace }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Muallifning lavozimi: ", bold: true }),
                            new TextRun({ text: data.authorPosition }),
                        ],
                        spacing: { after: 800 },
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                            new TextRun({
                                text: 'HUJJATNI TEKSHIRISH UCHUN QR KODDAN FOYDALANING',
                                bold: true,
                                size: 20,
                                color: '279EFF',
                            }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: 'Phoenix ', bold: true, color: '0A225F' }),
                            new TextRun({ text: 'NASHRIYOTI', size: 22, color: '279EFF' }),
                        ],
                    }),
                ],
            },
            {
                properties: {},
                children: [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'www.ilmiyfaoliyat.uz', bold: true, color: '0A225F' })],
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "MAQOLALAR NASHRI HAQIDA HISOBOT",
                                bold: true,
                                size: 28,
                                color: '0A225F',
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                        },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: '№', bold: true })] })],
                                        shading: { fill: 'F1F5F9' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: 'Ilmiy ish nomi', bold: true })] })],
                                        shading: { fill: 'F1F5F9' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: 'Nashr nomi va shakli', bold: true })] })],
                                        shading: { fill: 'F1F5F9' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: 'Internet havolasi', bold: true })] })],
                                        shading: { fill: 'F1F5F9' },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: 'Hammualliflar', bold: true })] })],
                                        shading: { fill: 'F1F5F9' },
                                    }),
                                ],
                            }),
                            ...data.articles.map(
                                (article, index) =>
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: String(index + 1) })] })],
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: article.title })] })],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: article.publishDate ? `${article.publishName} ${article.publishDate}` : article.publishName,
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: article.internetLink })] })],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: article.coAuthors.length > 0
                                                                    ? article.coAuthors.map((a, i) => `${i + 1}. ${a}`).join(', ')
                                                                    : '-',
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                        ],
                                    })
                            ),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `MAQOLALAR_NASHRI_HAQIDA_HISOBOT_${data.documentNumber}.docx`;
    saveAs(blob, fileName);
}
