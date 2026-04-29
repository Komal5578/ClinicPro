const demoGstProfiles = [
  {
    gst_number: '27ABCDE1234F1Z5',
    business_name: 'ClinicPro Health Services',
    address: 'Medical Plaza, Andheri East, Mumbai, Maharashtra, India',
    state: 'Maharashtra',
    status: 'Active',
  },
  {
    gst_number: '29ABCDE1234F1Z5',
    business_name: 'ClinicPro Care Center',
    address: '12 MG Road, Bengaluru, Karnataka, India',
    state: 'Karnataka',
    status: 'Active',
  },
  {
    gst_number: '07ABCDE1234F1Z5',
    business_name: 'ClinicPro Family Clinic',
    address: 'Saket District Centre, New Delhi, India',
    state: 'Delhi',
    status: 'Active',
  },
  {
    gst_number: '33ABCDE1234F1Z5',
    business_name: 'ClinicPro Dental Studio',
    address: 'Anna Salai, Chennai, Tamil Nadu, India',
    state: 'Tamil Nadu',
    status: 'Active',
  },
  {
    gst_number: '24ABCDE1234F1Z5',
    business_name: 'ClinicPro Ayur Wellness',
    address: 'SG Highway, Ahmedabad, Gujarat, India',
    state: 'Gujarat',
    status: 'Active',
  },
  {
    gst_number: '19ABCDE1234F1Z5',
    business_name: 'ClinicPro City Clinic',
    address: 'Park Street, Kolkata, West Bengal, India',
    state: 'West Bengal',
    status: 'Active',
  },
  {
    gst_number: '06ABCDE1234F1Z5',
    business_name: 'ClinicPro Family Care',
    address: 'Sector 17, Gurugram, Haryana, India',
    state: 'Haryana',
    status: 'Active',
  },
  {
    gst_number: '09ABCDE1234F1Z5',
    business_name: 'ClinicPro Metro Health',
    address: 'Hazratganj, Lucknow, Uttar Pradesh, India',
    state: 'Uttar Pradesh',
    status: 'Active',
  },
  {
    gst_number: '22ABCDE1234F1Z5',
    business_name: 'ClinicPro Central Clinic',
    address: 'Civil Lines, Raipur, Chhattisgarh, India',
    state: 'Chhattisgarh',
    status: 'Active',
  },
  {
    gst_number: '08ABCDE1234F1Z5',
    business_name: 'ClinicPro Plus Care',
    address: 'MI Road, Jaipur, Rajasthan, India',
    state: 'Rajasthan',
    status: 'Active',
  },
];

const demoGstMap = demoGstProfiles.reduce((acc, item) => {
  acc[item.gst_number] = item;
  return acc;
}, {});

const getDemoGstProfile = (gstNumber) => demoGstMap[String(gstNumber || '').toUpperCase().trim()] || null;

module.exports = {
  demoGstProfiles,
  getDemoGstProfile,
};
