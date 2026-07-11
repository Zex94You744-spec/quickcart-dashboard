import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  header: { backgroundColor: '#3B82F6', padding: 20, marginBottom: 20 },
  title: { color: 'white', fontSize: 28, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, color: '#1F2937' },
  text: { color: '#4B5563', marginBottom: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#3B82F6', padding: 8, marginTop: 15 },
  tableHeaderCell: { flex: 1, color: 'white', fontWeight: 'bold', fontSize: 10 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableCell: { flex: 1, fontSize: 10, color: '#1F2937' },
  total: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' },
  totalText: { fontSize: 14, fontWeight: 'bold', color: '#10B981' },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#6B7280', fontStyle: 'italic' }
});

export default function InvoicePDF({ order }) {
  const items = Array.isArray(order.items) ? order.items : [order.items];
  const totalAmount = items.length * 500;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
        </View>

        {/* Shop Info */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 }}>QuickCart Store</Text>
          <Text style={styles.text}>Order ID: {order.id}</Text>
          <Text style={styles.text}>Date: {new Date(order.created_id).toLocaleDateString('en-IN')}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.text}>Phone: {order.phone}</Text>
          <Text style={styles.text}>Address: {order.address}</Text>
        </View>

        {/* Items Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>#</Text>
          <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Item</Text>
          <Text style={styles.tableHeaderCell}>Qty</Text>
          <Text style={styles.tableHeaderCell}>Price</Text>
          <Text style={styles.tableHeaderCell}>Total</Text>
        </View>

        {/* Items Rows */}
        {items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tableCell}>{idx + 1}</Text>
            <Text style={{ ...styles.tableCell, flex: 2 }}>{item}</Text>
            <Text style={styles.tableCell}>1</Text>
            <Text style={styles.tableCell}>Rs.500</Text>
            <Text style={styles.tableCell}>Rs.500</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.total}>
          <Text style={styles.totalText}>Total Amount: Rs.{totalAmount}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Thank you for shopping with us! | For any queries, contact us.</Text>
      </Page>
    </Document>
  );
}
