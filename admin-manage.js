import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ovteiceidxxurslhypqp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dGVpY2VpZHh4dXJzbGh5cHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ2ODcsImV4cCI6MjA2MzQxMDY4N30.m9hzZxkBM_8IBWgbkgXh7puCNTVmDe-v_AA3vP_R1ws'
const supabase = createClient(supabaseUrl, supabaseKey)

const candidateList = document.getElementById('candidateList')
const candidateForm = document.getElementById('candidateForm')
const candidateNameInput = document.getElementById('candidateName')
const candidatePositionInput = document.getElementById('candidatePosition')

// Function to fetch candidates
async function fetchCandidates() {
    console.log('Fetching candidates for admin...')
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('name', { ascending: true })
    
    if (error) {
        console.error('Error fetching candidates:', error)
        return
    }
    
    renderCandidatesTable(data)
}

// Function to render candidates in the table
function renderCandidatesTable(candidates) {
    candidateList.innerHTML = '' // Clear existing rows
    
    if (!candidates || candidates.length === 0) {
        candidateList.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center;">
                    No candidates found. Add a candidate above.
                </td>
            </tr>
        `
        return
    }

    candidates.forEach(candidate => {
        const row = document.createElement('tr')
        row.innerHTML = `
            <td>${candidate.name}</td>
            <td>${candidate.position}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${candidate.id}">✏️ Edit</button>
                <button class="action-btn delete-btn" data-id="${candidate.id}">🗑️ Delete</button>
            </td>
        `
        candidateList.appendChild(row)
    })
}

// Function to handle adding a new candidate
candidateForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const name = candidateNameInput.value.trim()
    const position = candidatePositionInput.value.trim()

    if (!name || !position) {
        alert('Please enter both candidate name and position.')
        return
    }

    const { data, error } = await supabase
        .from('candidates')
        .insert([{ name, position }])

    if (error) {
        console.error('Error adding candidate:', error)
        alert('Error adding candidate: ' + error.message)
    } else {
        console.log('Candidate added successfully:', data)
        candidateForm.reset()
        // No need to manually fetch or update, realtime will handle it
    }
})

// Function to handle deleting a candidate
candidateList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const candidateId = e.target.dataset.id
        if (!confirm('Are you sure you want to delete this candidate?')) {
            return
        }

        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', candidateId)

        if (error) {
            console.error('Error deleting candidate:', error)
            alert('Error deleting candidate: ' + error.message)
        } else {
            console.log('Candidate deleted successfully')
            // No need to manually fetch or update, realtime will handle it
        }
    }

    // Functionality for editing (using prompt for now)
    if (e.target.classList.contains('edit-btn')) {
        const candidateId = e.target.dataset.id;
        const row = e.target.closest('tr');
        const nameCell = row.children[0];
        const positionCell = row.children[1];

        const newName = prompt("Edit Name:", nameCell.innerText);
        const newPosition = prompt("Edit Position:", positionCell.innerText);

        if (newName !== null && newPosition !== null) { // Check if prompts were not cancelled
            const { data, error } = await supabase
                .from('candidates')
                .update({ name: newName, position: newPosition })
                .eq('id', candidateId);

            if (error) {
                console.error('Error updating candidate:', error);
                alert('Error updating candidate: ' + error.message);
            } else {
                console.log('Candidate updated successfully:', data);
                // Realtime subscription will update the table
            }
        }
    }
})


// Set up real-time subscription
function setupRealtimeSubscription() {
    const subscription = supabase
        .channel('candidates_admin_changes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'candidates' 
            }, 
            payload => {
                console.log('Candidate change received!', payload)
                fetchCandidates() // Re-fetch and render the list on any change
            }
        )
        .subscribe()

    console.log('Realtime subscription for candidates set up.')
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchCandidates()
    setupRealtimeSubscription()
}) 