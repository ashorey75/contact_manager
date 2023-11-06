$(document).ready(function () {
  const addContactBtn = $('#add-contact-btn');
  const contactForm = $('#contact-form');
  const addEditContactForm = $('#add-edit-contact-form');
  const contactList = $('#contact-list');
  const contactWindow = $('#contact-window')
  const cancelBtn = $('#cancel-btn');
  
  let searchTimeout;
  let contacts = [];
  let selectedTag = 'all';
  
  async function fetchContacts() {
    try {
      contacts = await contactApi.getAllContacts();
      renderContacts();
    } catch (error) {
      console.error('Error fetching contacts:', error.message);
    }
  }
  
  fetchContacts();

  addContactBtn.on('click', function () {
    clearForm();
    contactForm.slideToggle();
    contactWindow.slideToggle();
  });

  cancelBtn.on('click', function () {
    contactForm.slideToggle();
    contactWindow.slideToggle();
    clearForm();
  });

  
  $('#tag-filter').on('change', function () {
    selectedTag = $(this).val();
    renderContacts();
  });
  
  const tagFilterSelect = $('#tag-filter');
  contactApi.getAllTags().forEach(tag => {
    tagFilterSelect.append(`<option value="${tag}">${tag}</option>`);
  });
  
  $('#add-contact-form').on('submit', saveContactHandler);
  
  $('#contact-list').on('click', '.edit-contact', async function () {
    const contactId = $(this).data('id');
    console.log(contactId);
    contactApi.contactId = contactId
  
    try {
      // Fetch the contact details by ID
      const contactDetails = await contactApi.getContactById(contactId);
  
      // Populate the form with the contact details
      $('#contactId').val(contactDetails.id);
      $('#full_name').val(contactDetails.full_name);
      $('#email').val(contactDetails.email);
      $('#phone_number').val(contactDetails.phone_number);
      $('#tags').val(contactDetails.tags);
  
      // Show the add-edit-contact-form
      contactForm.slideToggle();
      contactWindow.slideToggle();
    } catch (error) {
      console.error('Error fetching contact details for editing:', error.message);
    }
  });
  
  function updateTagFilter() {
    const tagFilterSelect = $('#tag-filter');
    tagFilterSelect.empty();
    tagFilterSelect.append('<option value="all">All</option>')
    
    
    let allTags = contactApi.getAllTags();
    allTags.forEach(tag => {
    const option = `<option value="${tag}" ${tag === selectedTag ? 'selected' : ''}>${tag}</option>`;
    tagFilterSelect.append(option);
  });
  }
  
  
  
  // Function to handle the submission of add-edit-contact-form
  async function saveContactHandler(event) {
    event.preventDefault();
  
    const contactId = contactApi.contactId;
    console.log('Contact ID:', contactId);
  
    const contactData = {
      full_name: $('#full_name').val(),
      email: $('#email').val(),
      phone_number: $('#phone_number').val(),
      tags: $('#tags').val(),
    };
  
    let exit;
  
    // Validation logic
    if (contactData.full_name.length < 3) {
      alert('Full Name must be at least 3 characters long.');
      exit = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      alert('Invalid email address.');
      exit = true;
    }
    
    const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(contactData.phone_number)) {
    alert('Invalid phone number. Please enter 10 digits.');
    exit = true;
  }
  
    try {
      if (exit) {
        return;
      } else {
        if (contactId) {
          // If contactId exists, update the existing contact
          await contactApi.updateContactById(contactId, contactData);
          
        } else {
          // If contactId doesn't exist, save a new contact
          await contactApi.saveNewContact(contactData);
        }
        
        
        contactApi.contactId = null;
  
        // Hide the add-edit-contact-form
        contactForm.slideToggle();
        contactWindow.slideToggle();
        clearForm();

        fetchContacts();
      }
    } catch (error) {
      console.error('Error saving contact:', error.message);
    }
  }
  
  $('#contact-list').on('click', '.remove-contact', async function () {
    const contactId = $(this).data('id');
    
    try {
      await contactApi.deleteContactById(contactId);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error.message);
    }
  });
  
  
  function updateTagsInput() {
    const tags = contactApi.getAllTags();
    $('#tags').empty(); // Clear existing options

    // Populate the select element with options
    tags.forEach(tag => {
      $('#tags').append(`<option value="${tag}">${tag}</option>`);
    });
  }
  
  
  $('#custom_tags').on('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault(); 

      const customTagsInput = $('#custom_tags');
      const customTagsString = customTagsInput.val().trim();

      if (customTagsString) {
        const newTags = customTagsString.split(',').map(tag => tag.trim());
        newTags.forEach(tag => contactApi.addTag(tag));

        // Update the tags input area
        updateTagsInput();

        // Clear the custom_tags field
        customTagsInput.val('');
      }
    }
  });
  
  $('#search').on('input', function () {
    // Clear the previous timeout
    clearTimeout(searchTimeout);

    // Set a new timeout
    searchTimeout = setTimeout(() => {
      renderContacts();
    }, 300); // Sets the timeout frame
  });
  



  function renderContacts() {
    const searchInput = $('#search').val().toLowerCase(); 
    const tagInput = selectedTag;
    let filteredContacts = contacts.filter(contact => contact.full_name.toLowerCase().includes(searchInput));
    
    if( tagInput !== 'all') {
      filteredContacts = filteredContacts.filter(contact => contact.tags && contact.tags.includes(tagInput))
    }
    
    contactList.empty();
    filteredContacts.forEach(function (contact) {
      console.log(contact);
  
      const tags = contact.tags 
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
        if (!contactApi.tags.includes(tag)) {
          contactApi.addTag(tag);
        }
      })
      }
      
        
      const listItem = $('<li>').html(`
        <strong>${contact.full_name}</strong>
        <ul>
          <li>Email: ${contact.email}</li>
          <li>Phone: ${contact.phone_number}</li>
          <li>Tags: ${tags ? tags : 'N/A'}</li>
        </ul>
        <button class="edit-contact" data-id="${contact.id}">Edit</button>
        <button class="remove-contact" data-id="${contact.id}">Remove</button>
      `);
      contactList.append(listItem);
      updateTagsInput();
      updateTagFilter();
    });
    console.log('Tags:', contactApi.getAllTags())
  }


  function clearForm() {
    $('#full_name').val('');
    $('#email').val('');
    $('#phone_number').val('');
    $('#tags').val('')
    $('#search').val('');
  }

});


class ContactAPI {
  constructor() {
    this.contactId = null;
    this.tags = [];
  }
  
  async getAllContacts() {
    try {
      const response = await fetch(`/api/contacts`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts. Status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching contacts:', error.message);
      throw error;
    }
  }
  
  
  async getContactById(id) {
    try {
      const response = await fetch(`/api/contacts/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contact. Status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Error fetching contact with id ${id}:`, error.message);
      throw error;
    }
  }
  
  async saveNewContact(contactData) {
    try {
      const response = await fetch(`/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save new contact. Status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error saving new contact:', error.message);
      throw error;
    }
  }

  async updateContactById(id, contactData) {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact. Status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error updating contact with id ${id}:`, error.message);
      throw error;
    }
  }

  async deleteContactById(id) {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete contact. Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting contact with id ${id}:`, error.message);
      throw error;
    }
  }
  
  getAllTags() {
    return this.tags;
  }

  addTag(tag) {
    this.tags.push(tag);
  }
  
}

const contactApi = new ContactAPI();