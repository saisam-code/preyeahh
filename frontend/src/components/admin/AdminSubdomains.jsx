import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { fetchManagedBranches } from "../../services/branchService.js";
import { fetchCareerDomains } from "../../services/careerDomainService.js";
import {
  createCareerSubdomain,
  deleteCareerSubdomain,
  fetchCareerSubdomains,
} from "../../services/careerSubdomainService.js";

function branchHasDomain(branch, domainId) {
  return branch.domainIds?.some((domain) =>
    String(typeof domain === "string" ? domain : domain._id) === domainId
  );
}

function toSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminSubdomains() {
  const [domains, setDomains] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [domainId, setDomainId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableBranches = useMemo(
    () => branches.filter((branch) => branchHasDomain(branch, domainId)),
    [branches, domainId]
  );

  useEffect(() => {
    Promise.all([fetchCareerDomains(), fetchManagedBranches()])
      .then(([domainList, branchList]) => {
        setDomains(domainList);
        setBranches(branchList);
        setDomainId(domainList[0]?._id || "");
      })
      .catch((error) => toast.error(error.response?.data?.message || "Could not load career taxonomy"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const compatibleBranch = availableBranches.find((branch) => branch._id === branchId);
    if (!compatibleBranch) setBranchId(availableBranches[0]?._id || "");
  }, [availableBranches, branchId]);

  useEffect(() => {
    if (!domainId || !branchId) {
      setSubdomains([]);
      return;
    }

    fetchCareerSubdomains({ domainId, branchId })
      .then(setSubdomains)
      .catch((error) => toast.error(error.response?.data?.message || "Could not load subdomains"));
  }, [domainId, branchId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const slug = toSlug(trimmedName);
    if (!trimmedName || !slug || !domainId || !branchId) {
      toast.error("Choose a domain and branch, then enter a valid subdomain name");
      return;
    }

    setSaving(true);
    try {
      await createCareerSubdomain({ name: trimmedName, slug, description: description.trim(), domainId, branchId });
      toast.success("Subdomain added");
      setName("");
      setDescription("");
      setSubdomains(await fetchCareerSubdomains({ domainId, branchId }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add subdomain");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subdomain) => {
    if (!window.confirm(`Delete "${subdomain.name}"? Roles assigned to it must be moved first.`)) return;
    try {
      await deleteCareerSubdomain(subdomain._id);
      toast.success("Subdomain deleted");
      setSubdomains(await fetchCareerSubdomains({ domainId, branchId }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete subdomain");
    }
  };

  if (loading) {
    return <div className="empty"><p>Loading career taxonomy...</p></div>;
  }

  return (
    <div className="admin-subdomains">
      <div className="admin-header">
        <div>
          <h2>Manage Subdomains</h2>
          <p>Each subdomain belongs to one career domain and one associated branch.</p>
        </div>
      </div>

      {domains.length === 0 && (
        <div className="empty">
          <p>No career domains are available. Run the career-domain migration before managing subdomains.</p>
        </div>
      )}

      {domains.length > 0 && (
        <>
          <div className="admin-subdomain-context">
            <div className="form-group">
              <label htmlFor="subdomain-domain">Career domain</label>
              <select id="subdomain-domain" value={domainId} onChange={(event) => setDomainId(event.target.value)}>
                {domains.map((domain) => <option key={domain._id} value={domain._id}>{domain.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="subdomain-branch">Associated branch</label>
              <select
                id="subdomain-branch"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                disabled={availableBranches.length === 0}
              >
                {availableBranches.length === 0 ? (
                  <option value="">Associate a branch with this domain first</option>
                ) : (
                  availableBranches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)
                )}
              </select>
            </div>
          </div>

          <form className="admin-subdomain-form" onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="subdomain-name">Subdomain name</label>
              <input
                id="subdomain-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Renewable Energy"
                maxLength={100}
                required
              />
            </div>
            <div className="form-group admin-subdomain-description">
              <label htmlFor="subdomain-description">Description (optional)</label>
              <input
                id="subdomain-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe this area of study"
                maxLength={500}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving || !branchId}>
              <FaPlus aria-hidden="true" /> {saving ? "Adding..." : "Add subdomain"}
            </button>
          </form>

          {availableBranches.length === 0 ? (
            <div className="empty">
              <p>There are no branches linked to this domain yet. Add the association under Manage Branches.</p>
            </div>
          ) : subdomains.length === 0 ? (
            <div className="empty"><p>No subdomains have been added for this domain and branch.</p></div>
          ) : (
            <div className="admin-subdomain-list">
              {subdomains.map((subdomain) => (
                <article className="admin-subdomain-card" key={subdomain._id}>
                  <div>
                    <h3>{subdomain.name}</h3>
                    <p>{subdomain.description || "No description provided."}</p>
                    <code>{subdomain.slug}</code>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(subdomain)}
                    aria-label={`Delete ${subdomain.name}`}
                  >
                    <FaTrash aria-hidden="true" /> Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
